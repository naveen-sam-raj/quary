import { Router } from "express";
import {
  getTreasurySummary,
  getTreasuryLedger,
  withdrawPasses,
  getTreasurySpentLoads
} from "../controllers/treasury.controller.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { withdrawSchema } from "../validators/treasury.validator.js";

const router = Router();

// Protect all treasury routes
router.use(authRequired);

// GET /api/treasury/summary
router.get("/summary", asyncHandler(getTreasurySummary));

// GET /api/treasury/ledger
router.get("/ledger", asyncHandler(getTreasuryLedger));

// POST /api/treasury/withdraw (Admin, Manager)
router.post(
  "/withdraw",
  requireRole("admin", "manager"),
  validateBody(withdrawSchema),
  asyncHandler(withdrawPasses)
);

// GET /api/treasury/spent
router.get("/spent", asyncHandler(getTreasurySpentLoads));

export default router;
