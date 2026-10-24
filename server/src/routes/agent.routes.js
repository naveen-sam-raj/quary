import { Router } from "express";
import {
  getAgents,
  getAgentsSummary,
  getAgentById,
  createAgent,
  updateAgent,
  updateAgentStatus,
  deleteAgent
} from "../controllers/agent.controller.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import {
  createAgentSchema,
  updateAgentSchema,
  updateAgentStatusSchema
} from "../validators/agent.validator.js";

const router = Router();

// Protect all agent routes
router.use(authRequired);

// GET /api/agents/summary (Placeholder for Phase 3 aggregation)
router.get("/summary", asyncHandler(getAgentsSummary));

// GET /api/agents (List, search, filter, paginate)
router.get("/", asyncHandler(getAgents));

// GET /api/agents/:id
router.get("/:id", asyncHandler(getAgentById));

// POST /api/agents (Admin, Manager)
router.post(
  "/",
  requireRole("admin", "manager"),
  validateBody(createAgentSchema),
  asyncHandler(createAgent)
);

// PUT /api/agents/:id (Admin, Manager)
router.put(
  "/:id",
  requireRole("admin", "manager"),
  validateBody(updateAgentSchema),
  asyncHandler(updateAgent)
);

// PATCH /api/agents/:id/status (Admin, Manager)
router.patch(
  "/:id/status",
  requireRole("admin", "manager"),
  validateBody(updateAgentStatusSchema),
  asyncHandler(updateAgentStatus)
);

// DELETE /api/agents/:id (Admin only - soft delete)
router.delete("/:id", requireRole("admin"), asyncHandler(deleteAgent));

export default router;
