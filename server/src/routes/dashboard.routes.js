import { Router } from "express";
import { getDashboardSummary } from "../controllers/dashboard.controller.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateQuery } from "../middleware/validate.js";
import { dashboardSummaryQuerySchema } from "../validators/dashboard.validator.js";

const router = Router();

// Protect all dashboard routes
router.use(authRequired);

// GET /api/dashboard/summary (admin, manager, viewer)
router.get(
  "/summary",
  requireRole("admin", "manager", "viewer"),
  validateQuery(dashboardSummaryQuerySchema),
  asyncHandler(getDashboardSummary)
);

export default router;
