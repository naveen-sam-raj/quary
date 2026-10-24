import { z } from "zod";

export const withdrawSchema = z.object({
  passes: z.coerce
    .number({ required_error: "Passes count is required", invalid_type_error: "Passes count must be a number" })
    .int("Passes count must be an integer")
    .min(1, "Passes count must be at least 1"),
  note: z.string().trim().optional().default("")
});
