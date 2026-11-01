import { Router } from "express";
import { exportBackup } from "../controllers/backup.controller.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

// Protect all backup routes - Admin only
router.use(authRequired);
router.use(requireRole("admin"));

// GET /api/backup/export
router.get("/export", asyncHandler(exportBackup));

export default router;
