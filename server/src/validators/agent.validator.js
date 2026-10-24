import { z } from "zod";
import { phoneSchema, optionalPhoneSchema } from "./common.validator.js";

export const createAgentSchema = z.object({
  name: z
    .string({ required_error: "Agent name is required" })
    .trim()
    .min(1, "Agent name cannot be empty"),
  phone: phoneSchema,
  company: z.string().trim().optional().default(""),
  location: z.string().trim().optional().default(""),
  commission: z
    .coerce
    .number({ invalid_type_error: "Commission must be a number" })
    .min(0, "Commission cannot be negative")
    .optional()
    .default(0),
  openingBalance: z
    .coerce
    .number({ invalid_type_error: "Opening balance must be a number" })
    .optional()
    .default(0),
  status: z
    .enum(["active", "inactive"], {
      errorMap: () => ({ message: "Status must be either active or inactive" })
    })
    .optional()
    .default("active"),
  notes: z.string().trim().optional().default("")
});

export const updateAgentSchema = z.object({
  name: z.string().trim().min(1, "Agent name cannot be empty").optional(),
  phone: optionalPhoneSchema,
  company: z.string().trim().optional(),
  location: z.string().trim().optional(),
  commission: z
    .coerce
    .number({ invalid_type_error: "Commission must be a number" })
    .min(0, "Commission cannot be negative")
    .optional(),
  openingBalance: z
    .coerce
    .number({ invalid_type_error: "Opening balance must be a number" })
    .optional(),
  status: z
    .enum(["active", "inactive"], {
      errorMap: () => ({ message: "Status must be either active or inactive" })
    })
    .optional(),
  notes: z.string().trim().optional()
});

export const updateAgentStatusSchema = z.object({
  status: z
    .enum(["active", "inactive"], {
      errorMap: () => ({ message: "Status must be either active or inactive" })
    })
    .optional()
});
