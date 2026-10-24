import { z } from "zod";
import { objectIdSchema } from "./common.validator.js";

const optionalObjectId = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  return val;
}, objectIdSchema.optional());

export const createLoadSchema = z.object({
  date: z
    .string({ required_error: "Date is required" })
    .refine((val) => !isNaN(Date.parse(val)), "Date must be a valid date"),
  lorryNo: z
    .string({ required_error: "Lorry number is required" })
    .trim()
    .min(1, "Lorry number cannot be empty"),
  material: z
    .string({ required_error: "Material is required" })
    .trim()
    .min(1, "Material cannot be empty"),
  quantity: z.coerce
    .number({ invalid_type_error: "Quantity must be a number" })
    .min(0, "Quantity cannot be negative")
    .optional()
    .default(0),
  rate: z.coerce
    .number({ invalid_type_error: "Rate must be a number" })
    .min(0, "Rate cannot be negative")
    .optional()
    .default(0),
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .min(0, "Amount cannot be negative")
    .optional(),
  agentId: objectIdSchema,
  subBuyerId: optionalObjectId,
  notes: z.string().trim().optional().default("")
});

export const updateLoadSchema = z.object({
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Date must be a valid date")
    .optional(),
  lorryNo: z.string().trim().min(1, "Lorry number cannot be empty").optional(),
  material: z.string().trim().min(1, "Material cannot be empty").optional(),
  quantity: z.coerce
    .number({ invalid_type_error: "Quantity must be a number" })
    .min(0, "Quantity cannot be negative")
    .optional(),
  rate: z.coerce
    .number({ invalid_type_error: "Rate must be a number" })
    .min(0, "Rate cannot be negative")
    .optional(),
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .min(0, "Amount cannot be negative")
    .optional(),
  agentId: objectIdSchema.optional(),
  subBuyerId: optionalObjectId,
  notes: z.string().trim().optional()
});
