import { Router } from "express";
import {
  getLoads,
  createLoad,
  updateLoad,
  deleteLoad
} from "../controllers/load.controller.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { createLoadSchema, updateLoadSchema } from "../validators/load.validator.js";

const router = Router();

// Protect all load routes
router.use(authRequired);

// GET /api/loads (List, query filter, paginate)
router.get("/", asyncHandler(getLoads));

// POST /api/loads (Admin, Manager)
router.post(
  "/",
  requireRole("admin", "manager"),
  validateBody(createLoadSchema),
  asyncHandler(createLoad)
);

// PUT /api/loads/:id (Admin, Manager - batch cannot be changed)
router.put(
  "/:id",
  requireRole("admin", "manager"),
  validateBody(updateLoadSchema),
  asyncHandler(updateLoad)
);

// DELETE /api/loads/:id (Admin only - returns pass)
router.delete("/:id", requireRole("admin"), asyncHandler(deleteLoad));

export default router;
