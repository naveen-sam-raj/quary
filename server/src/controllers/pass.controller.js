import { PassBatch } from "../models/PassBatch.js";
import { TreasuryLedger } from "../models/TreasuryLedger.js";
import { Settings } from "../models/Settings.js";
import {
  autoReturnExpired,
  getTreasuryBalance,
  withTransaction
} from "../services/passService.js";
import {
  getDaysLeftIST,
  getEndOfDayIST,
  addDaysIST,
  getStartOfDayIST
} from "../utils/date.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * GET /api/passes/batches
 * Query: source, status
 * Returns batches with remaining, daysLeft, and displayStatus
 */
export const getBatches = async (req, res) => {
  await autoReturnExpired();

  const settings = await Settings.getSettings();
  const warningDays = settings.warningDays;

  const filter = {};
  if (req.query.source) {
    filter.source = req.query.source;
  }

  const batches = await PassBatch.find(filter).sort({ createdAt: -1 });

  let items = batches.map((batch) => {
    const remaining = Math.max(0, batch.totalPasses - batch.usedPasses - batch.returnedToTreasury);
    const daysLeft = batch.validTill ? getDaysLeftIST(batch.validTill) : null;

    let displayStatus = "active";
    if (batch.status === "returned") {
      displayStatus = "returned";
    } else if (batch.status === "exhausted" || remaining <= 0) {
      displayStatus = "exhausted";
    } else if (
      batch.source === "govt" &&
      daysLeft !== null &&
      daysLeft <= warningDays &&
      daysLeft >= 0
    ) {
      displayStatus = "expiring_soon";
    }

    const doc = batch.toObject();
    return {
      ...doc,
      remaining,
      daysLeft,
      displayStatus
    };
  });

  if (req.query.status) {
    items = items.filter(
      (item) => item.displayStatus === req.query.status || item.status === req.query.status
    );
  }

  return sendSuccess(res, { items, total: items.length }, "Batches retrieved successfully");
};

/**
 * POST /api/passes/batches
 * Admin and Manager only
 */
export const createBatch = async (req, res) => {
  const { batchNo, totalPasses, issueDate, validityDays, validTill, feePerPass, note } = req.body;

  const existing = await PassBatch.findOne({ batchNo: batchNo.trim() });
  if (existing) {
    return sendError(res, "Batch number already exists", 409);
  }

  const settings = await Settings.getSettings();
  const resolvedValidityDays = validityDays ?? settings.defaultValidityDays;

  let resolvedValidTill = null;
  if (validTill) {
    resolvedValidTill = getEndOfDayIST(validTill);
  } else if (issueDate) {
    resolvedValidTill = addDaysIST(issueDate, resolvedValidityDays);
  }

  const batch = await PassBatch.create({
    batchNo: batchNo.trim(),
    source: "govt",
    totalPasses,
    usedPasses: 0,
    returnedToTreasury: 0,
    issueDate: new Date(issueDate),
    validityDays: resolvedValidityDays,
    validTill: resolvedValidTill,
    feePerPass: feePerPass ?? 0,
    status: "active",
    note: note || ""
  });

  return sendSuccess(res, { batch }, "Batch created successfully", 201);
};

/**
 * PATCH /api/passes/batches/:id/return
 * Admin only - early return of remaining passes to Treasury
 */
export const returnBatchEarly = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body || {};

  const result = await withTransaction(async (session) => {
    const batch = await PassBatch.findById(id).session(session);
    if (!batch) {
      const err = new Error("Batch not found");
      err.statusCode = 404;
      throw err;
    }

    if (batch.status === "returned") {
      const err = new Error("Batch has already been returned to treasury");
      err.statusCode = 400;
      throw err;
    }

    const remaining = batch.totalPasses - batch.usedPasses - batch.returnedToTreasury;
    if (remaining <= 0) {
      const err = new Error("No remaining passes to return");
      err.statusCode = 400;
      throw err;
    }

    batch.returnedToTreasury += remaining;
    batch.status = "returned";
    await batch.save({ session });

    const [ledgerEntry] = await TreasuryLedger.create(
      [
        {
          date: new Date(),
          type: "received_manual",
          batchId: batch._id,
          passes: remaining,
          note: note || "Early manual return of batch",
          createdBy: req.user._id
        }
      ],
      session ? { session } : {}
    );

    return { batch, remaining, ledgerEntry };
  });

  return sendSuccess(
    res,
    { batch: result.batch, returnedPasses: result.remaining },
    "Batch returned to treasury successfully"
  );
};

/**
 * GET /api/passes/summary
 * { totalBoughtFromGovt, usedByLorries, activeRemaining, treasuryBalance, nextExpiry: { batchNo, daysLeft, passes }, lowStock }
 */
export const getPassesSummary = async (req, res) => {
  await autoReturnExpired();

  const [settings, { balance: treasuryBalance }, batches] = await Promise.all([
    Settings.getSettings(),
    getTreasuryBalance(),
    PassBatch.find()
  ]);

  let totalBoughtFromGovt = 0;
  let usedByLorries = 0;
  let activeRemaining = 0;

  const startOfToday = getStartOfDayIST(new Date());
  let candidateGovtBatches = [];

  for (const batch of batches) {
    if (batch.source === "govt") {
      totalBoughtFromGovt += batch.totalPasses;
    }

    usedByLorries += batch.usedPasses;

    const remaining = Math.max(0, batch.totalPasses - batch.usedPasses - batch.returnedToTreasury);

    if (batch.status === "active" && remaining > 0) {
      activeRemaining += remaining;

      if (batch.source === "govt" && batch.validTill && batch.validTill >= startOfToday) {
        candidateGovtBatches.push({
          batchNo: batch.batchNo,
          validTill: batch.validTill,
          daysLeft: getDaysLeftIST(batch.validTill),
          passes: remaining
        });
      }
    }
  }

  // Find next expiry (earliest validTill >= startOfToday with remaining > 0)
  candidateGovtBatches.sort((a, b) => new Date(a.validTill) - new Date(b.validTill));

  const nextExpiry =
    candidateGovtBatches.length > 0
      ? {
          batchNo: candidateGovtBatches[0].batchNo,
          daysLeft: candidateGovtBatches[0].daysLeft,
          passes: candidateGovtBatches[0].passes
        }
      : null;

  const lowStock = activeRemaining <= settings.lowStockLimit;

  return sendSuccess(
    res,
    {
      totalBoughtFromGovt,
      usedByLorries,
      activeRemaining,
      treasuryBalance,
      nextExpiry,
      lowStock
    },
    "Passes summary retrieved successfully"
  );
};

/**
 * GET /api/passes/alerts
 * Batches expiring within warningDays + low stock warning
 */
export const getPassAlerts = async (req, res) => {
  await autoReturnExpired();

  const settings = await Settings.getSettings();
  const warningDays = settings.warningDays;
  const startOfToday = getStartOfDayIST(new Date());

  const activeGovtBatches = await PassBatch.find({
    source: "govt",
    status: "active",
    validTill: { $gte: startOfToday }
  }).sort({ validTill: 1 });

  const expiringSoonBatches = [];
  let activeRemaining = 0;

  for (const batch of activeGovtBatches) {
    const remaining = Math.max(0, batch.totalPasses - batch.usedPasses - batch.returnedToTreasury);
    if (remaining > 0) {
      activeRemaining += remaining;
      const daysLeft = getDaysLeftIST(batch.validTill);
      if (daysLeft !== null && daysLeft <= warningDays && daysLeft >= 0) {
        expiringSoonBatches.push({
          _id: batch._id,
          batchNo: batch.batchNo,
          daysLeft,
          validTill: batch.validTill,
          remaining
        });
      }
    }
  }

  // Also include active treasury batches in activeRemaining
  const activeTreasuryBatches = await PassBatch.find({
    source: "treasury",
    status: "active"
  });

  for (const batch of activeTreasuryBatches) {
    const remaining = Math.max(0, batch.totalPasses - batch.usedPasses - batch.returnedToTreasury);
    activeRemaining += remaining;
  }

  return sendSuccess(
    res,
    {
      expiringSoonBatches,
      lowStock: {
        isLow: activeRemaining <= settings.lowStockLimit,
        current: activeRemaining,
        limit: settings.lowStockLimit
      }
    },
    "Pass alerts retrieved successfully"
  );
};
