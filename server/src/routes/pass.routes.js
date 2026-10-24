import { Router } from "express";
import {
  getBatches,
  createBatch,
  returnBatchEarly,
  getPassesSummary,
  getPassAlerts
} from "../controllers/pass.controller.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { createBatchSchema, returnBatchSchema } from "../validators/pass.validator.js";

const router = Router();

// Protect all pass routes
router.use(authRequired);

// GET /api/passes/summary
router.get("/summary", asyncHandler(getPassesSummary));

// GET /api/passes/alerts
router.get("/alerts", asyncHandler(getPassAlerts));

// GET /api/passes/batches
router.get("/batches", asyncHandler(getBatches));

// POST /api/passes/batches (Admin, Manager)
router.post(
  "/batches",
  requireRole("admin", "manager"),
  validateBody(createBatchSchema),
  asyncHandler(createBatch)
);

// PATCH /api/passes/batches/:id/return (Admin only)
router.patch(
  "/batches/:id/return",
  requireRole("admin"),
  validateBody(returnBatchSchema),
  asyncHandler(returnBatchEarly)
);

export default router;
