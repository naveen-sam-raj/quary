import { z } from "zod";
import { optionalPhoneSchema, objectIdSchema } from "./common.validator.js";

export const createSubBuyerSchema = z.object({
  agentId: objectIdSchema,
  name: z
    .string({ required_error: "Sub-buyer name is required" })
    .trim()
    .min(1, "Sub-buyer name cannot be empty"),
  phone: optionalPhoneSchema.default(""),
  location: z.string().trim().optional().default("")
});

export const updateSubBuyerSchema = z.object({
  agentId: objectIdSchema.optional(),
  name: z.string().trim().min(1, "Sub-buyer name cannot be empty").optional(),
  phone: optionalPhoneSchema,
  location: z.string().trim().optional()
});
