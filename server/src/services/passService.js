import mongoose from "mongoose";
import { PassBatch } from "../models/PassBatch.js";
import { TreasuryLedger } from "../models/TreasuryLedger.js";
import { getStartOfDayIST } from "../utils/date.js";

/**
 * Runs an asynchronous operation within a MongoDB transaction session.
 * Gracefully falls back to running without a session if the MongoDB server
 * is a standalone instance that does not support replica set transactions.
 * @param {Function} fn Function taking (session) and returning a Promise
 */
export const withTransaction = async (fn) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }
    // If running on a standalone MongoDB without replica set, fall back without session
    if (
      error.message &&
      (error.message.includes("replica set") ||
        error.message.includes("Transaction numbers are only allowed"))
    ) {
      if (process.env.NODE_ENV === "production") throw error;
      console.warn("[Transaction] Standalone MongoDB detected, running WITHOUT transaction:", error.message);
      return await fn(null);
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

/**
 * Computes current Treasury balance from TreasuryLedger using aggregation.
 * Never stores the balance directly.
 * Formula: sum(received_*) - sum(withdrawn)
 * @param {import("mongoose").ClientSession|null} [session=null]
 * @returns {Promise<{ totalReceived: number, totalWithdrawn: number, balance: number }>}
 */
export const getTreasuryBalance = async (session = null) => {
  const query = TreasuryLedger.aggregate([
    {
      $group: {
        _id: null,
        totalReceived: {
          $sum: {
            $cond: [
              { $regexMatch: { input: "$type", regex: /^received_/ } },
              "$passes",
              0
            ]
          }
        },
        totalWithdrawn: {
          $sum: {
            $cond: [
              { $eq: ["$type", "withdrawn"] },
              "$passes",
              0
            ]
          }
        }
      }
    }
  ]);

  if (session) {
    query.session(session);
  }

  const result = await query;
  const totalReceived = result[0]?.totalReceived || 0;
  const totalWithdrawn = result[0]?.totalWithdrawn || 0;
  const balance = totalReceived - totalWithdrawn;

  return {
    totalReceived,
    totalWithdrawn,
    balance
  };
};

/**
 * Auto-returns expired govt batches to the Treasury.
 * Rule: find govt batches where validTill < start of today (IST), status is not "returned",
 * remaining > 0 (where remaining = totalPasses - usedPasses - returnedToTreasury).
 * For each: returnedToTreasury += remaining, status = "returned",
 * insert TreasuryLedger { type: "received_expired", passes: remaining, note: "Auto-returned on expiry" }.
 * Must be IDEMPOTENT (never process the same batch twice; uses atomic conditional update).
 * @param {import("mongoose").ClientSession|null} [session=null]
 * @returns {Promise<{ batchesReturned: number, passesReturned: number }>}
 */
export const autoReturnExpired = async (session = null) => {
  const startOfToday = getStartOfDayIST(new Date());

  // Find govt batches that have expired and are not already marked returned
  const expiredBatches = await PassBatch.find({
    source: "govt",
    status: { $ne: "returned" },
    validTill: { $lt: startOfToday }
  }).session(session);

  let batchesReturned = 0;
  let passesReturned = 0;

  for (const batch of expiredBatches) {
    const remaining = batch.totalPasses - batch.usedPasses - batch.returnedToTreasury;

    if (remaining <= 0) {
      // Mark as returned if not already
      await PassBatch.updateOne(
        { _id: batch._id, status: { $ne: "returned" } },
        { $set: { status: "returned" } },
        { session }
      );
      continue;
    }

    // Idempotent conditional atomic update
    const updated = await PassBatch.findOneAndUpdate(
      {
        _id: batch._id,
        status: { $ne: "returned" },
        returnedToTreasury: batch.returnedToTreasury
      },
      {
        $set: {
          returnedToTreasury: batch.returnedToTreasury + remaining,
          status: "returned"
        }
      },
      { new: true, session }
    );

    if (updated) {
      await TreasuryLedger.create(
        [
          {
            date: new Date(),
            type: "received_expired",
            batchId: updated._id,
            passes: remaining,
            note: "Auto-returned on expiry"
          }
        ],
        session ? { session } : {}
      );

      batchesReturned += 1;
      passesReturned += remaining;
    }
  }

  return { batchesReturned, passesReturned };
};

/**
 * Selects and consumes 1 pass using FIFO order.
 * Rule 5: Govt batches first (earliest validTill first),
 * treasury batches only when no valid govt pass is left (oldest first).
 * Never use an expired batch.
 * Atomically increments usedPasses. If fully used, sets status to "exhausted".
 * Throws 400 "No active passes. Withdraw from Treasury or procure a new batch." if none.
 * @param {import("mongoose").ClientSession|null} [session=null]
 * @returns {Promise<import("../models/PassBatch.js").PassBatch>}
 */
export const consumePassFIFO = async (session = null) => {
  // Ensure expired batches are returned first
  await autoReturnExpired(session);

  const startOfToday = getStartOfDayIST(new Date());

  // Step 1: Find active govt batches sorted by earliest validTill, then oldest creation
  const govtCandidates = await PassBatch.find({
    source: "govt",
    status: "active",
    validTill: { $gte: startOfToday }
  })
    .sort({ validTill: 1, createdAt: 1 })
    .session(session);

  for (const candidate of govtCandidates) {
    const remaining = candidate.totalPasses - candidate.usedPasses - candidate.returnedToTreasury;
    if (remaining > 0) {
      const updated = await PassBatch.findOneAndUpdate(
        {
          _id: candidate._id,
          status: "active",
          $expr: {
            $lt: [{ $add: ["$usedPasses", "$returnedToTreasury"] }, "$totalPasses"]
          }
        },
        { $inc: { usedPasses: 1 } },
        { new: true, session }
      );

      if (updated) {
        if (updated.usedPasses + updated.returnedToTreasury >= updated.totalPasses) {
          updated.status = "exhausted";
          await updated.save({ session });
        }
        return updated;
      }
    }
  }

  // Step 2: No valid govt passes left. Look for treasury batches (oldest first)
  const treasuryCandidates = await PassBatch.find({
    source: "treasury",
    status: "active"
  })
    .sort({ createdAt: 1 })
    .session(session);

  for (const candidate of treasuryCandidates) {
    const remaining = candidate.totalPasses - candidate.usedPasses - candidate.returnedToTreasury;
    if (remaining > 0) {
      const updated = await PassBatch.findOneAndUpdate(
        {
          _id: candidate._id,
          status: "active",
          $expr: {
            $lt: [{ $add: ["$usedPasses", "$returnedToTreasury"] }, "$totalPasses"]
          }
        },
        { $inc: { usedPasses: 1 } },
        { new: true, session }
      );

      if (updated) {
        if (updated.usedPasses + updated.returnedToTreasury >= updated.totalPasses) {
          updated.status = "exhausted";
          await updated.save({ session });
        }
        return updated;
      }
    }
  }

  // No passes available
  const error = new Error("No active passes. Withdraw from Treasury or procure a new batch.");
  error.statusCode = 400;
  throw error;
};

/**
 * Releases a pass when a load is deleted.
 * If the batch is still active or exhausted, decrements usedPasses and sets status back to active.
 * If the batch was already returned to treasury, inserts a TreasuryLedger entry
 * type "received_manual", passes 1, note "Load deleted after batch expiry".
 * @param {string|mongoose.Types.ObjectId} batchId
 * @param {import("mongoose").ClientSession|null} [session=null]
 */
export const releasePass = async (batchId, session = null) => {
  const batch = await PassBatch.findById(batchId).session(session);
  if (!batch) {
    return;
  }

  if (batch.status === "returned") {
    // Batch has already expired and was returned to Treasury
    await TreasuryLedger.create(
      [
        {
          date: new Date(),
          type: "received_manual",
          batchId: batch._id,
          passes: 1,
          note: "Load deleted after batch expiry"
        }
      ],
      session ? { session } : {}
    );
  } else {
    // Batch is active or exhausted
    batch.usedPasses = Math.max(0, batch.usedPasses - 1);
    batch.status = "active";
    await batch.save({ session });
  }
};

/**
 * Withdraws passes from Treasury.
 * Rule: Reject if passes > balance (400 "Only X passes available in Treasury").
 * Inserts ledger entry type "withdrawn", creates batch TRS-YYYY-### (auto-increment per year),
 * source "treasury", validTill null, feePerPass 0.
 * @param {number} passes
 * @param {string} note
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {import("mongoose").ClientSession|null} [session=null]
 * @returns {Promise<{ batch: import("../models/PassBatch.js").PassBatch, ledgerEntry: import("../models/TreasuryLedger.js").TreasuryLedger }>}
 */
export const withdrawFromTreasury = async (passes, note, userId, session = null) => {
  const { balance } = await getTreasuryBalance(session);

  if (passes > balance) {
    const error = new Error(`Only ${balance} passes available in Treasury`);
    error.statusCode = 400;
    throw error;
  }

  const year = new Date().getFullYear();

  // Find existing TRS batches for this year to auto-increment sequence
  const latestTrsBatches = await PassBatch.find({
    batchNo: new RegExp(`^TRS-${year}-\\d+$`)
  })
    .sort({ batchNo: -1 })
    .session(session);

  let nextSeq = 1;
  if (latestTrsBatches.length > 0) {
    for (const b of latestTrsBatches) {
      const parts = b.batchNo.split("-");
      const seq = parseInt(parts[2], 10);
      if (!isNaN(seq) && seq >= nextSeq) {
        nextSeq = seq + 1;
      }
    }
  }

  const batchNo = `TRS-${year}-${String(nextSeq).padStart(3, "0")}`;

  const [batch] = await PassBatch.create(
    [
      {
        batchNo,
        source: "treasury",
        totalPasses: passes,
        usedPasses: 0,
        returnedToTreasury: 0,
        issueDate: new Date(),
        validityDays: null,
        validTill: null,
        feePerPass: 0,
        status: "active",
        note: note || ""
      }
    ],
    session ? { session } : {}
  );

  const [ledgerEntry] = await TreasuryLedger.create(
    [
      {
        date: new Date(),
        type: "withdrawn",
        batchId: batch._id,
        passes,
        note: note || "Withdrawn from Treasury",
        createdBy: userId || null
      }
    ],
    session ? { session } : {}
  );

  return { batch, ledgerEntry };
};
