import { TreasuryLedger } from "../models/TreasuryLedger.js";
import { PassBatch } from "../models/PassBatch.js";
import { Load } from "../models/Load.js";
import {
  autoReturnExpired,
  getTreasuryBalance,
  withdrawFromTreasury,
  withTransaction
} from "../services/passService.js";
import { sendSuccess } from "../utils/response.js";

/**
 * GET /api/treasury/summary
 * Returns { totalReceived, totalWithdrawn, spent, balance }
 */
export const getTreasurySummary = async (req, res) => {
  await autoReturnExpired();

  const [{ totalReceived, totalWithdrawn, balance }, treasuryBatches] = await Promise.all([
    getTreasuryBalance(),
    PassBatch.find({ source: "treasury" })
  ]);

  const spent = treasuryBatches.reduce((acc, b) => acc + (b.usedPasses || 0), 0);

  return sendSuccess(
    res,
    {
      totalReceived,
      totalWithdrawn,
      spent,
      balance
    },
    "Treasury summary retrieved successfully"
  );
};

/**
 * GET /api/treasury/ledger
 * Query: page, limit
 * Newest first, each row with running balanceAfter
 */
export const getTreasuryLedger = async (req, res) => {
  await autoReturnExpired();

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));

  // Retrieve all ledger records chronologically to calculate accurate running balance
  const allRecords = await TreasuryLedger.find()
    .sort({ date: 1, createdAt: 1, _id: 1 })
    .populate("batchId", "batchNo source")
    .populate("createdBy", "name email")
    .lean();

  let runningBalance = 0;
  const enrichedRecords = allRecords.map((record) => {
    if (record.type && record.type.startsWith("received_")) {
      runningBalance += record.passes;
    } else if (record.type === "withdrawn") {
      runningBalance -= record.passes;
    }

    return {
      ...record,
      balanceAfter: runningBalance
    };
  });

  // Reverse to display newest first
  enrichedRecords.reverse();

  const total = enrichedRecords.length;
  const skip = (page - 1) * limit;
  const items = enrichedRecords.slice(skip, skip + limit);
  const pages = Math.ceil(total / limit) || 1;

  return sendSuccess(
    res,
    {
      items,
      total,
      page,
      pages
    },
    "Treasury ledger retrieved successfully"
  );
};

/**
 * POST /api/treasury/withdraw
 * Admin and Manager only
 * Body: { passes, note }
 */
export const withdrawPasses = async (req, res) => {
  const { passes, note } = req.body;

  const result = await withTransaction(async (session) => {
    return await withdrawFromTreasury(passes, note, req.user._id, session);
  });

  return sendSuccess(
    res,
    result,
    "Passes withdrawn from treasury successfully",
    201
  );
};

/**
 * GET /api/treasury/spent
 * Loads that used treasury batches: date, lorryNo, agent name, batchNo
 */
export const getTreasurySpentLoads = async (req, res) => {
  const treasuryBatches = await PassBatch.find({ source: "treasury" }).select("_id batchNo").lean();
  const batchMap = new Map(treasuryBatches.map((b) => [b._id.toString(), b.batchNo]));
  const batchIds = treasuryBatches.map((b) => b._id);

  const loads = await Load.find({ passBatchId: { $in: batchIds } })
    .sort({ date: -1, createdAt: -1 })
    .populate("agentId", "name company")
    .lean();

  const items = loads.map((load) => ({
    _id: load._id,
    date: load.date,
    lorryNo: load.lorryNo,
    material: load.material,
    quantity: load.quantity,
    amount: load.amount,
    agent: load.agentId?.name || "Unknown Agent",
    batchNo: batchMap.get(load.passBatchId?.toString()) || ""
  }));

  return sendSuccess(res, { items, total: items.length }, "Treasury spent loads retrieved successfully");
};
