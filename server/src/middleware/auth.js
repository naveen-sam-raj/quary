import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { sendError } from "../utils/response.js";

/**
 * Middleware to protect routes and verify Bearer JWT token
 */
export const authRequired = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Authorization token is missing or malformed", 401);
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return sendError(res, "Authentication token missing", 401);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("[Auth] Error: JWT_SECRET is not configured");
      return sendError(res, "Internal authentication configuration error", 500);
    }

    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.id).select("-passwordHash");

    if (!user) {
      return sendError(res, "User associated with this token no longer exists", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return sendError(res, "Token has expired. Please log in again.", 401);
    }
    if (error.name === "JsonWebTokenError") {
      return sendError(res, "Invalid authentication token", 401);
    }
    return sendError(res, "Authentication failed", 401);
  }
};

/**
 * Middleware to restrict access based on allowed roles
 * @param  {...string} roles Allowed roles ('admin', 'manager', 'viewer')
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, "Unauthorized: Authentication required", 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Forbidden: Role '${req.user.role}' does not have permission to access this resource`,
        403
      );
    }

    next();
  };
};
