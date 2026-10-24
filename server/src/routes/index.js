import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import agentRoutes from "./agent.routes.js";
import subbuyerRoutes from "./subbuyer.routes.js";
import purchaseRoutes from "./purchase.routes.js";
import passRoutes from "./pass.routes.js";
import treasuryRoutes from "./treasury.routes.js";
import settingsRoutes from "./settings.routes.js";
import loadRoutes from "./load.routes.js";

const router = Router();

// API Route Mounts
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/agents", agentRoutes);
router.use("/subbuyers", subbuyerRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/passes", passRoutes);
router.use("/treasury", treasuryRoutes);
router.use("/settings", settingsRoutes);
router.use("/loads", loadRoutes);

export default router;
