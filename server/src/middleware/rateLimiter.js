import rateLimit from "express-rate-limit";

/**
 * Rate limiter for login endpoint
 * Limit: 10 requests per 15 minutes per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: "Too many login attempts from this IP. Please try again after 15 minutes."
  }
});
