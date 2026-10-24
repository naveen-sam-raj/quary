import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import agentRoutes from "./agent.routes.js";
import subbuyerRoutes from "./subbuyer.routes.js";
import purchaseRoutes from "./purchase.routes.js";

const router = Router();

// API Route Mounts
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/agents", agentRoutes);
router.use("/subbuyers", subbuyerRoutes);
router.use("/purchases", purchaseRoutes);

export default router;
