import { z } from "zod";

export const dateRangeQuerySchema = z.object({
  from: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "From date must be a valid date")
    .optional(),
  to: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "To date must be a valid date")
    .optional()
});
