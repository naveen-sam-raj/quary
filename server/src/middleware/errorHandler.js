/**
 * 404 Route Not Found Handler
 */
export const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    data: null,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
};

/**
 * Centralized Error Handler
 * Ensures consistent response format: { success: false, data: null, message: "..." }
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || "Internal server error";

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join("; ");
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const duplicatedKeys = Object.keys(err.keyValue || {}).join(", ");
    message = `Duplicate value error for field(s): ${duplicatedKeys}`;
  }

  // Mongoose invalid ObjectId CastError
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid format for resource identifier: ${err.value}`;
  }

  // Log error stack for unexpected server errors (non-production or dev)
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  return res.status(statusCode).json({
    success: false,
    data: null,
    message
  });
};
