import { Agent } from "../models/Agent.js";
import { SubBuyer } from "../models/SubBuyer.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * GET /api/agents
 * Query: search, status, page, limit
 * Excludes soft-deleted agents, returns { items, total, page, pages }
 */
export const getAgents = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = { isDeleted: false };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search.trim(), "i");
    filter.$or = [
      { name: searchRegex },
      { phone: searchRegex },
      { company: searchRegex }
    ];
  }

  const [items, total] = await Promise.all([
    Agent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Agent.countDocuments(filter)
  ]);

  const pages = Math.ceil(total / limit) || 1;

  return sendSuccess(
    res,
    {
      items,
      total,
      page,
      pages
    },
    "Agents retrieved successfully"
  );
};

/**
 * GET /api/agents/summary
 * Placeholder returning agents list with totalLoads: 0 and totalAmount: 0 (Phase 3 aggregation)
 */
export const getAgentsSummary = async (req, res) => {
  const agents = await Agent.find({ isDeleted: false })
    .sort({ name: 1 })
    .lean();

  const items = agents.map((agent) => ({
    ...agent,
    totalLoads: 0,
    totalAmount: 0
  }));

  return sendSuccess(
    res,
    {
      items,
      total: items.length
    },
    "Agents summary retrieved successfully"
  );
};

/**
 * GET /api/agents/:id
 */
export const getAgentById = async (req, res) => {
  const { id } = req.params;

  const agent = await Agent.findOne({ _id: id, isDeleted: false });

  if (!agent) {
    return sendError(res, "Agent not found", 404);
  }

  return sendSuccess(res, { agent }, "Agent retrieved successfully");
};

/**
 * POST /api/agents
 * Admin and Manager only
 * Rejects duplicate phone with 409 "Phone already registered"
 */
export const createAgent = async (req, res) => {
  const { name, phone, company, location, commission, openingBalance, status, notes } = req.body;

  // Check for duplicate active phone
  const existingAgent = await Agent.findOne({ phone, isDeleted: false });
  if (existingAgent) {
    return sendError(res, "Phone already registered", 409);
  }

  const agent = await Agent.create({
    name,
    phone,
    company: company || "",
    location: location || "",
    commission: commission ?? 0,
    openingBalance: openingBalance ?? 0,
    status: status || "active",
    notes: notes || ""
  });

  return sendSuccess(res, { agent }, "Agent created successfully", 201);
};

/**
 * PUT /api/agents/:id
 * Admin and Manager only
 */
export const updateAgent = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const agent = await Agent.findOne({ _id: id, isDeleted: false });
  if (!agent) {
    return sendError(res, "Agent not found", 404);
  }

  // If phone is updated, check for duplicate phone on other agents
  if (updates.phone && updates.phone !== agent.phone) {
    const duplicate = await Agent.findOne({
      _id: { $ne: id },
      phone: updates.phone,
      isDeleted: false
    });
    if (duplicate) {
      return sendError(res, "Phone already registered", 409);
    }
  }

  Object.assign(agent, updates);
  await agent.save();

  return sendSuccess(res, { agent }, "Agent updated successfully");
};

/**
 * PATCH /api/agents/:id/status
 * Admin and Manager only
 * Toggles or updates active/inactive status
 */
export const updateAgentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const agent = await Agent.findOne({ _id: id, isDeleted: false });
  if (!agent) {
    return sendError(res, "Agent not found", 404);
  }

  if (status) {
    agent.status = status;
  } else {
    agent.status = agent.status === "active" ? "inactive" : "active";
  }

  await agent.save();

  return sendSuccess(res, { agent }, `Agent status changed to ${agent.status}`);
};

/**
 * DELETE /api/agents/:id
 * Admin only
 * Soft deletes agent and its associated sub-buyers
 */
export const deleteAgent = async (req, res) => {
  const { id } = req.params;

  const agent = await Agent.findOne({ _id: id, isDeleted: false });
  if (!agent) {
    return sendError(res, "Agent not found", 404);
  }

  // TODO: in Phase 3, check linked loads before deleting

  // Soft delete the agent
  agent.isDeleted = true;
  agent.status = "inactive";
  await agent.save();

  // Soft delete its sub-buyers
  await SubBuyer.updateMany(
    { agentId: id, isDeleted: false },
    { $set: { isDeleted: true } }
  );

  return sendSuccess(
    res,
    null,
    "Agent and associated sub-buyers deleted successfully"
  );
};
