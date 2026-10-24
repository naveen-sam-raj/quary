import { Router } from "express";
import { login, getMe, loginSchema } from "../controllers/auth.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authRequired } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { loginRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// POST /api/auth/login -> Rate limited (10 per 15 min), body validated with Zod
router.post("/login", loginRateLimiter, validateBody(loginSchema), asyncHandler(login));

// GET /api/auth/me -> Protected by authRequired
router.get("/me", authRequired, asyncHandler(getMe));

export default router;
