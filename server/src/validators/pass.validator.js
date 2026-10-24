import { z } from "zod";

export const createBatchSchema = z.object({
  batchNo: z
    .string({ required_error: "Batch number is required" })
    .trim()
    .min(1, "Batch number cannot be empty"),
  totalPasses: z.coerce
    .number({ required_error: "Total passes is required", invalid_type_error: "Total passes must be a number" })
    .int("Total passes must be an integer")
    .min(1, "Total passes must be at least 1"),
  issueDate: z
    .string({ required_error: "Issue date is required" })
    .refine((val) => !isNaN(Date.parse(val)), "Issue date must be a valid date"),
  validityDays: z.coerce
    .number({ invalid_type_error: "Validity days must be a number" })
    .int("Validity days must be an integer")
    .min(1, "Validity days must be at least 1")
    .optional(),
  validTill: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Valid till must be a valid date")
    .optional(),
  feePerPass: z.coerce
    .number({ invalid_type_error: "Fee per pass must be a number" })
    .min(0, "Fee per pass cannot be negative")
    .optional()
    .default(0),
  note: z.string().trim().optional().default("")
});

export const returnBatchSchema = z.object({
  note: z.string().trim().optional().default("")
});
