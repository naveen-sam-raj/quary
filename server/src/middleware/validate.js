import { sendError } from "../utils/response.js";

/**
 * Middleware generator to validate request bodies against a Zod schema
 * @param {import("zod").ZodSchema} schema
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const formattedErrors = result.error.errors.map((err) => {
        const field = err.path.join(".") || "body";
        return `${field}: ${err.message}`;
      });

      const message = formattedErrors.join("; ");
      return sendError(res, message || "Validation error", 400, result.error.flatten());
    }

    req.body = result.data;
    next();
  };
};

/**
 * Middleware generator to validate request query params against a Zod schema
 * @param {import("zod").ZodSchema} schema
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const formattedErrors = result.error.errors.map((err) => {
        const field = err.path.join(".") || "query";
        return `${field}: ${err.message}`;
      });

      const message = formattedErrors.join("; ");
      return sendError(res, message || "Validation error", 400, result.error.flatten());
    }

    req.query = result.data;
    next();
  };
};
