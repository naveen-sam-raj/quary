import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { sendError, sendSuccess } from "../utils/response.js";

/**
 * Validation schema for login
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Please provide a valid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required")
});

/**
 * POST /api/auth/login
 * Public login endpoint with rate limiting
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  // Find user by lowercase email
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return sendError(res, "Invalid email or password", 401);
  }

  // Validate password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return sendError(res, "Invalid email or password", 401);
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("[Auth] Missing JWT_SECRET in environment variables");
    return sendError(res, "Internal server authentication configuration error", 500);
  }

  // Sign JWT with 7 day expiry
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    jwtSecret,
    { expiresIn: "7d" }
  );

  return sendSuccess(
    res,
    {
      token,
      user: user.toJSON()
    },
    "Login successful",
    200
  );
};

/**
 * GET /api/auth/me
 * Protected endpoint returning current user profile
 */
export const getMe = async (req, res) => {
  return sendSuccess(
    res,
    {
      user: req.user
    },
    "User profile retrieved successfully",
    200
  );
};
