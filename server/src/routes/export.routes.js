import { Router } from "express";
import {
  exportLoadsExcel,
  exportPurchasesExcel,
  exportReportPDF
} from "../controllers/export.controller.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateQuery } from "../middleware/validate.js";
import { dateRangeQuerySchema } from "../validators/export.validator.js";

const router = Router();

// Protect all export routes (admin, manager, viewer)
router.use(authRequired);
router.use(requireRole("admin", "manager", "viewer"));

// GET /api/export/loads.xlsx
router.get("/loads.xlsx", validateQuery(dateRangeQuerySchema), asyncHandler(exportLoadsExcel));

// GET /api/export/purchases.xlsx
router.get("/purchases.xlsx", validateQuery(dateRangeQuerySchema), asyncHandler(exportPurchasesExcel));

// GET /api/export/report.pdf
router.get("/report.pdf", validateQuery(dateRangeQuerySchema), asyncHandler(exportReportPDF));

export default router;
