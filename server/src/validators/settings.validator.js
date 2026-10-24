import { z } from "zod";

export const updateSettingsSchema = z.object({
  defaultValidityDays: z.coerce
    .number({ invalid_type_error: "Default validity days must be a number" })
    .int("Default validity days must be an integer")
    .min(1, "Default validity days must be at least 1")
    .optional(),
  warningDays: z.coerce
    .number({ invalid_type_error: "Warning days must be a number" })
    .int("Warning days must be an integer")
    .min(1, "Warning days must be at least 1")
    .optional(),
  lowStockLimit: z.coerce
    .number({ invalid_type_error: "Low stock limit must be a number" })
    .int("Low stock limit must be an integer")
    .min(1, "Low stock limit must be at least 1")
    .optional()
});
