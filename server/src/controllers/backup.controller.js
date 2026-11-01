import { Agent } from "../models/Agent.js";
import { SubBuyer } from "../models/SubBuyer.js";
import { Load } from "../models/Load.js";
import { Purchase } from "../models/Purchase.js";
import { PassBatch } from "../models/PassBatch.js";
import { TreasuryLedger } from "../models/TreasuryLedger.js";
import { Settings } from "../models/Settings.js";
import { IST_OFFSET_MS } from "../utils/date.js";

/**
 * GET /api/backup/export
 * Admin only
 * Exports JSON file download with all quarry operational data (excludes users & credentials).
 */
export const exportBackup = async (req, res) => {
  const [
    agents,
    subBuyers,
    loads,
    purchases,
    passBatches,
    treasuryLedger,
    settingsDoc
  ] = await Promise.all([
    Agent.find().lean(),
    SubBuyer.find().lean(),
    Load.find().lean(),
    Purchase.find().lean(),
    PassBatch.find().lean(),
    TreasuryLedger.find().lean(),
    Settings.findOne().lean()
  ]);

  const backupData = {
    meta: {
      exportedAt: new Date().toISOString(),
      counts: {
        agents: agents.length,
        subBuyers: subBuyers.length,
        loads: loads.length,
        purchases: purchases.length,
        passBatches: passBatches.length,
        treasuryLedger: treasuryLedger.length,
        settings: settingsDoc ? 1 : 0
      }
    },
    data: {
      agents,
      subBuyers,
      loads,
      purchases,
      passBatches,
      treasuryLedger,
      settings: settingsDoc || null
    }
  };

  // Get current date string in IST YYYY-MM-DD
  const nowIST = new Date(Date.now() + IST_OFFSET_MS);
  const yStr = nowIST.getUTCFullYear();
  const mStr = String(nowIST.getUTCMonth() + 1).padStart(2, "0");
  const dStr = String(nowIST.getUTCDate()).padStart(2, "0");
  const filename = `blue-metal-backup-${yStr}-${mStr}-${dStr}.json`;

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  return res.status(200).send(JSON.stringify(backupData, null, 2));
};
