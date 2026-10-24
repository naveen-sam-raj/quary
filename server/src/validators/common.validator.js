import { z } from "zod";

/**
 * Strips +91, spaces, and leading zero from phone numbers
 */
export const sanitizePhone = (val) => {
  if (typeof val !== "string") return val;
  return val
    .replace(/^\+91\s*/, "")
    .replace(/\s+/g, "")
    .replace(/^0/, "");
};

/**
 * Required 10-digit Indian phone schema
 */
export const phoneSchema = z.preprocess(
  sanitizePhone,
  z
    .string({ required_error: "Phone number is required" })
    .regex(/^[6-9]\d{9}$/, "Phone must be a valid 10-digit Indian mobile number")
);

/**
 * Optional 10-digit Indian phone schema
 */
export const optionalPhoneSchema = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    return sanitizePhone(val);
  },
  z
    .string()
    .regex(/^[6-9]\d{9}$/, "Phone must be a valid 10-digit Indian mobile number")
    .optional()
);

/**
 * MongoDB ObjectId string validation
 */
export const objectIdSchema = z
  .string({ required_error: "ID is required" })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");
