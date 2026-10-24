import cron from "node-cron";
import { autoReturnExpired } from "../services/passService.js";

/**
 * Initializes the daily cron job scheduled at 00:05 Asia/Kolkata timezone.
 * Auto-returns expired govt batches to Treasury.
 */
export const startPassExpiryCron = () => {
  const job = cron.schedule(
    "5 0 * * *",
    async () => {
      try {
        console.log("[Cron] Running daily auto-return expired passes check at 00:05 IST...");
        const result = await autoReturnExpired();
        console.log(
          `[Cron] Completed auto-return: ${result.batchesReturned} batches, ${result.passesReturned} passes moved to Treasury.`
        );
      } catch (error) {
        console.error("[Cron] Error running daily auto-return expired passes:", error.message);
      }
    },
    {
      timezone: "Asia/Kolkata"
    }
  );

  console.log("[Cron] Daily pass expiry auto-return scheduled at 00:05 IST (Asia/Kolkata).");
  return job;
};
