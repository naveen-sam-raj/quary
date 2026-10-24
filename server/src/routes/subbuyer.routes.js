import { Router } from "express";
import {
  getSubBuyers,
  getSubBuyerById,
  createSubBuyer,
  updateSubBuyer,
  deleteSubBuyer
} from "../controllers/subbuyer.controller.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import {
  createSubBuyerSchema,
  updateSubBuyerSchema
} from "../validators/subbuyer.validator.js";

const router = Router();

// Protect all sub-buyer routes
router.use(authRequired);

// GET /api/subbuyers (query: agentId, search)
router.get("/", asyncHandler(getSubBuyers));

// GET /api/subbuyers/:id
router.get("/:id", asyncHandler(getSubBuyerById));

// POST /api/subbuyers (Admin, Manager)
router.post(
  "/",
  requireRole("admin", "manager"),
  validateBody(createSubBuyerSchema),
  asyncHandler(createSubBuyer)
);

// PUT /api/subbuyers/:id (Admin, Manager)
router.put(
  "/:id",
  requireRole("admin", "manager"),
  validateBody(updateSubBuyerSchema),
  asyncHandler(updateSubBuyer)
);

// DELETE /api/subbuyers/:id (Soft delete)
router.delete(
  "/:id",
  requireRole("admin", "manager"),
  asyncHandler(deleteSubBuyer)
);

export default router;
