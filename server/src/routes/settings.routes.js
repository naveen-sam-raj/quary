import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settings.controller.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { updateSettingsSchema } from "../validators/settings.validator.js";

const router = Router();

// Protect all settings routes
router.use(authRequired);

// GET /api/settings (All authenticated users)
router.get("/", asyncHandler(getSettings));

// PUT /api/settings (Admin only)
router.put(
  "/",
  requireRole("admin"),
  validateBody(updateSettingsSchema),
  asyncHandler(updateSettings)
);

export default router;
