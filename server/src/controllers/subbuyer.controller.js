import { SubBuyer } from "../models/SubBuyer.js";
import { Agent } from "../models/Agent.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * GET /api/subbuyers
 * Query: agentId, search
 * Excludes soft-deleted sub-buyers
 */
export const getSubBuyers = async (req, res) => {
  const filter = { isDeleted: false };

  if (req.query.agentId) {
    filter.agentId = req.query.agentId;
  }

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search.trim(), "i");
    filter.$or = [
      { name: searchRegex },
      { phone: searchRegex },
      { location: searchRegex }
    ];
  }

  const items = await SubBuyer.find(filter)
    .populate("agentId", "name phone company status")
    .sort({ createdAt: -1 });

  return sendSuccess(
    res,
    {
      items,
      total: items.length
    },
    "Sub-buyers retrieved successfully"
  );
};

/**
 * GET /api/subbuyers/:id
 */
export const getSubBuyerById = async (req, res) => {
  const { id } = req.params;

  const subBuyer = await SubBuyer.findOne({ _id: id, isDeleted: false }).populate(
    "agentId",
    "name phone company status"
  );

  if (!subBuyer) {
    return sendError(res, "Sub-buyer not found", 404);
  }

  return sendSuccess(res, { subBuyer }, "Sub-buyer retrieved successfully");
};

/**
 * POST /api/subbuyers
 * Admin and Manager only
 * Validates that agentId exists and is not deleted
 */
export const createSubBuyer = async (req, res) => {
  const { agentId, name, phone, location } = req.body;

  // Verify associated agent exists and is active/non-deleted
  const agent = await Agent.findOne({ _id: agentId, isDeleted: false });
  if (!agent) {
    return sendError(res, "Associated agent not found or has been deleted", 404);
  }

  const subBuyer = await SubBuyer.create({
    agentId,
    name,
    phone: phone || "",
    location: location || ""
  });

  return sendSuccess(res, { subBuyer }, "Sub-buyer created successfully", 201);
};

/**
 * PUT /api/subbuyers/:id
 * Admin and Manager only
 */
export const updateSubBuyer = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const subBuyer = await SubBuyer.findOne({ _id: id, isDeleted: false });
  if (!subBuyer) {
    return sendError(res, "Sub-buyer not found", 404);
  }

  // If agentId is being updated, verify target agent exists
  if (updates.agentId && updates.agentId !== subBuyer.agentId.toString()) {
    const agent = await Agent.findOne({ _id: updates.agentId, isDeleted: false });
    if (!agent) {
      return sendError(res, "Associated agent not found or has been deleted", 404);
    }
  }

  Object.assign(subBuyer, updates);
  await subBuyer.save();

  return sendSuccess(res, { subBuyer }, "Sub-buyer updated successfully");
};

/**
 * DELETE /api/subbuyers/:id
 * Soft delete (isDeleted = true)
 */
export const deleteSubBuyer = async (req, res) => {
  const { id } = req.params;

  const subBuyer = await SubBuyer.findOne({ _id: id, isDeleted: false });
  if (!subBuyer) {
    return sendError(res, "Sub-buyer not found", 404);
  }

  subBuyer.isDeleted = true;
  await subBuyer.save();

  return sendSuccess(res, null, "Sub-buyer deleted successfully");
};
