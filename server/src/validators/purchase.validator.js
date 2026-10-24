import { z } from "zod";
import { PURCHASE_CATEGORIES } from "../models/Purchase.js";

export const createPurchaseSchema = z.object({
  date: z
    .string({ required_error: "Date is required" })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Date must be a valid ISO or date format"
    }),
  category: z.enum(PURCHASE_CATEGORIES, {
    errorMap: () => ({
      message: `Category must be one of: ${PURCHASE_CATEGORIES.join(", ")}`
    })
  }),
  vendor: z
    .string({ required_error: "Vendor is required" })
    .trim()
    .min(1, "Vendor name cannot be empty"),
  amount: z
    .coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than 0"),
  notes: z.string().trim().optional().default("")
});

export const updatePurchaseSchema = z.object({
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Date must be a valid ISO or date format"
    })
    .optional(),
  category: z
    .enum(PURCHASE_CATEGORIES, {
      errorMap: () => ({
        message: `Category must be one of: ${PURCHASE_CATEGORIES.join(", ")}`
      })
    })
    .optional(),
  vendor: z.string().trim().min(1, "Vendor name cannot be empty").optional(),
  amount: z
    .coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than 0")
    .optional(),
  notes: z.string().trim().optional()
});
