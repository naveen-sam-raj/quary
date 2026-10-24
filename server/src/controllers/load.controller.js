import { Load } from "../models/Load.js";
import { Agent } from "../models/Agent.js";
import { SubBuyer } from "../models/SubBuyer.js";
import {
  autoReturnExpired,
  consumePassFIFO,
  releasePass,
  withTransaction
} from "../services/passService.js";
import { getDaysLeftIST } from "../utils/date.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * GET /api/loads
 * Query: from, to, agentId, subBuyerId, search, page, limit
 * Returns items populated with agent name, subBuyer name, batchNo;
 * plus total and totalAmount of the filtered result.
 */
export const getLoads = async (req, res) => {
  await autoReturnExpired();

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};

  // Date range filter
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) {
      const fromDate = new Date(req.query.from);
      if (!isNaN(fromDate.getTime())) {
        filter.date.$gte = fromDate;
      }
    }
    if (req.query.to) {
      const toDate = new Date(req.query.to);
      if (!isNaN(toDate.getTime())) {
        if (req.query.to.trim().length <= 10) {
          toDate.setUTCHours(23, 59, 59, 999);
        }
        filter.date.$lte = toDate;
      }
    }
  }

  // Agent filter
  if (req.query.agentId) {
    filter.agentId = req.query.agentId;
  }

  // SubBuyer filter
  if (req.query.subBuyerId) {
    filter.subBuyerId = req.query.subBuyerId;
  }

  // Search filter (lorryNo, material, notes)
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search.trim(), "i");
    filter.$or = [
      { lorryNo: searchRegex },
      { material: searchRegex },
      { notes: searchRegex }
    ];
  }

  const [itemsRaw, total, totalAmountAgg] = await Promise.all([
    Load.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("agentId", "name company")
      .populate("subBuyerId", "name phone location")
      .populate("passBatchId", "batchNo source validTill")
      .lean(),
    Load.countDocuments(filter),
    Load.aggregate([
      { $match: filter },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
    ])
  ]);

  const totalAmount = totalAmountAgg.length > 0 ? totalAmountAgg[0].totalAmount : 0;
  const pages = Math.ceil(total / limit) || 1;

  const items = itemsRaw.map((load) => ({
    ...load,
    agentName: load.agentId?.name || "Unknown Agent",
    subBuyerName: load.subBuyerId?.name || null,
    batchNo: load.passBatchId?.batchNo || ""
  }));

  return sendSuccess(
    res,
    {
      items,
      total,
      totalAmount,
      page,
      pages
    },
    "Loads retrieved successfully"
  );
};

/**
 * POST /api/loads
 * Admin and Manager only
 * Validates agent and subBuyer. Inside transaction: consumes FIFO pass, creates Load.
 * Returns load plus passFrom { batchNo, expiresInDays | "no expiry" }
 */
export const createLoad = async (req, res) => {
  const { date, lorryNo, material, quantity, rate, amount, agentId, subBuyerId, notes } = req.body;

  // 1. Verify agent is active and not deleted
  const agent = await Agent.findOne({ _id: agentId, isDeleted: false });
  if (!agent) {
    return sendError(res, "Agent is not active or does not exist", 400);
  }
  if (agent.status !== "active") {
    return sendError(res, "Agent is not active", 400);
  }

  // 2. Verify subBuyer if provided
  if (subBuyerId) {
    const subBuyer = await SubBuyer.findOne({
      _id: subBuyerId,
      agentId,
      isDeleted: false
    });
    if (!subBuyer) {
      return sendError(res, "Sub-buyer does not belong to the selected agent or is inactive", 400);
    }
  }

  // 3. Compute amount if not provided
  let calculatedAmount = amount;
  if (calculatedAmount === undefined || calculatedAmount === null || calculatedAmount === 0) {
    calculatedAmount = (quantity || 0) * (rate || 0);
  }

  // 4. Run inside transaction
  const result = await withTransaction(async (session) => {
    // Consume pass atomically
    const passBatch = await consumePassFIFO(session);

    const [load] = await Load.create(
      [
        {
          date: new Date(date),
          lorryNo: lorryNo.trim(),
          material: material.trim(),
          quantity: quantity || 0,
          rate: rate || 0,
          amount: calculatedAmount,
          agentId,
          subBuyerId: subBuyerId || null,
          passBatchId: passBatch._id,
          notes: notes || "",
          createdBy: req.user._id
        }
      ],
      session ? { session } : {}
    );

    const daysLeft = passBatch.validTill ? getDaysLeftIST(passBatch.validTill) : null;
    const expiresInDays = daysLeft !== null ? daysLeft : "no expiry";

    const passFrom = {
      batchNo: passBatch.batchNo,
      expiresInDays
    };

    return { load, passFrom };
  });

  return sendSuccess(
    res,
    { load: result.load, passFrom: result.passFrom },
    "Load created successfully",
    201
  );
};

/**
 * PUT /api/loads/:id
 * Admin and Manager only
 * Pass batch cannot be changed, only normal fields.
 */
export const updateLoad = async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  // Explicitly disallow changing the passBatchId
  delete updates.passBatchId;
  delete updates.createdBy;

  const load = await Load.findById(id);
  if (!load) {
    return sendError(res, "Load not found", 404);
  }

  // Validate agent if updated
  const targetAgentId = updates.agentId || load.agentId;
  if (updates.agentId && updates.agentId.toString() !== load.agentId.toString()) {
    const agent = await Agent.findOne({ _id: updates.agentId, isDeleted: false });
    if (!agent || agent.status !== "active") {
      return sendError(res, "Agent is not active or does not exist", 400);
    }
  }

  // Validate subBuyer if updated
  if (updates.subBuyerId) {
    const subBuyer = await SubBuyer.findOne({
      _id: updates.subBuyerId,
      agentId: targetAgentId,
      isDeleted: false
    });
    if (!subBuyer) {
      return sendError(res, "Sub-buyer does not belong to the selected agent or is inactive", 400);
    }
  }

  if (updates.date) {
    updates.date = new Date(updates.date);
  }

  // Recalculate amount if quantity or rate was provided without amount
  const newQty = updates.quantity ?? load.quantity;
  const newRate = updates.rate ?? load.rate;
  if (updates.amount === undefined && (updates.quantity !== undefined || updates.rate !== undefined)) {
    updates.amount = newQty * newRate;
  }

  Object.assign(load, updates);
  await load.save();

  const populated = await Load.findById(load._id)
    .populate("agentId", "name company")
    .populate("subBuyerId", "name phone location")
    .populate("passBatchId", "batchNo source validTill");

  return sendSuccess(res, { load: populated }, "Load updated successfully");
};

/**
 * DELETE /api/loads/:id
 * Admin only
 * Transaction: releasePass, then delete the load
 */
export const deleteLoad = async (req, res) => {
  const { id } = req.params;

  await withTransaction(async (session) => {
    const load = await Load.findById(id).session(session);
    if (!load) {
      const err = new Error("Load not found");
      err.statusCode = 404;
      throw err;
    }

    // Release pass back to batch or treasury
    await releasePass(load.passBatchId, session);

    // Delete the load
    await Load.findByIdAndDelete(id, { session });
  });

  return sendSuccess(res, null, "Load deleted and pass released successfully");
};
