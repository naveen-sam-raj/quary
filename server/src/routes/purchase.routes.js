import { Router } from "express";
import {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase
} from "../controllers/purchase.controller.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import {
  createPurchaseSchema,
  updatePurchaseSchema
} from "../validators/purchase.validator.js";

const router = Router();

// Protect all purchase routes
router.use(authRequired);

// GET /api/purchases (from, to, category, search, page, limit)
router.get("/", asyncHandler(getPurchases));

// GET /api/purchases/:id
router.get("/:id", asyncHandler(getPurchaseById));

// POST /api/purchases (Admin, Manager)
router.post(
  "/",
  requireRole("admin", "manager"),
  validateBody(createPurchaseSchema),
  asyncHandler(createPurchase)
);

// PUT /api/purchases/:id (Admin, Manager)
router.put(
  "/:id",
  requireRole("admin", "manager"),
  validateBody(updatePurchaseSchema),
  asyncHandler(updatePurchase)
);

// DELETE /api/purchases/:id (Admin only - hard delete)
router.delete("/:id", requireRole("admin"), asyncHandler(deletePurchase));

export default router;
