import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { PassBatch } from "../models/PassBatch.js";
import { Load } from "../models/Load.js";
import { Agent } from "../models/Agent.js";
import { SubBuyer } from "../models/SubBuyer.js";
import { User } from "../models/User.js";
import { autoReturnExpired, consumePassFIFO } from "../services/passService.js";
import { addDaysIST, getEndOfDayIST } from "../utils/date.js";

// Ensure .env is loaded from server root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const seedDemoPasses = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error("[Seed Demo Passes] Error: MONGO_URI is missing in environment variables.");
    process.exit(1);
  }

  try {
    console.log("[Seed Demo Passes] Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("[Seed Demo Passes] Connected to database.");

    // Find an admin user for createdBy reference
    let adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      adminUser = await User.findOne();
    }
    const createdBy = adminUser ? adminUser._id : null;

    // 1. Ensure Demo Batches
    // Batch 1: TN-GEO-2026-881: 50 passes, validTill = today + 5 days
    let batch881 = await PassBatch.findOne({ batchNo: "TN-GEO-2026-881" });
    if (!batch881) {
      batch881 = await PassBatch.create({
        batchNo: "TN-GEO-2026-881",
        source: "govt",
        totalPasses: 50,
        usedPasses: 0,
        returnedToTreasury: 0,
        issueDate: new Date(),
        validityDays: 30,
        validTill: addDaysIST(new Date(), 5),
        feePerPass: 150,
        status: "active",
        note: "Government procurement batch 881 (expiring in 5 days)"
      });
      console.log(`[Seed Demo Passes] Created batch: TN-GEO-2026-881`);
    } else {
      console.log(`[Seed Demo Passes] Batch TN-GEO-2026-881 already exists. Skipping creation.`);
    }

    // Batch 2: TN-GEO-2026-942: 30 passes, issued today, 30 days validity
    let batch942 = await PassBatch.findOne({ batchNo: "TN-GEO-2026-942" });
    if (!batch942) {
      batch942 = await PassBatch.create({
        batchNo: "TN-GEO-2026-942",
        source: "govt",
        totalPasses: 30,
        usedPasses: 0,
        returnedToTreasury: 0,
        issueDate: new Date(),
        validityDays: 30,
        validTill: addDaysIST(new Date(), 30),
        feePerPass: 150,
        status: "active",
        note: "Government procurement batch 942 (issued today, 30 days validity)"
      });
      console.log(`[Seed Demo Passes] Created batch: TN-GEO-2026-942`);
    } else {
      console.log(`[Seed Demo Passes] Batch TN-GEO-2026-942 already exists. Skipping creation.`);
    }

    // Batch 3: TN-GEO-2026-700: 40 passes, 20 already used, validTill = 3 days ago (so 20 passes move to Treasury on first run)
    let batch700 = await PassBatch.findOne({ batchNo: "TN-GEO-2026-700" });
    if (!batch700) {
      batch700 = await PassBatch.create({
        batchNo: "TN-GEO-2026-700",
        source: "govt",
        totalPasses: 40,
        usedPasses: 20,
        returnedToTreasury: 0,
        issueDate: addDaysIST(new Date(), -33),
        validityDays: 30,
        validTill: addDaysIST(new Date(), -3),
        feePerPass: 140,
        status: "active",
        note: "Historical government batch 700 (expired 3 days ago)"
      });
      console.log(`[Seed Demo Passes] Created batch: TN-GEO-2026-700`);
    } else {
      console.log(`[Seed Demo Passes] Batch TN-GEO-2026-700 already exists. Skipping creation.`);
    }

    // 2. Trigger autoReturnExpired (moves unused passes of batch 700 to Treasury)
    console.log("[Seed Demo Passes] Running autoReturnExpired...");
    const returnResult = await autoReturnExpired();
    console.log(
      `[Seed Demo Passes] Auto-returned expired batches: ${returnResult.batchesReturned} batches, ${returnResult.passesReturned} passes moved to Treasury.`
    );

    // 3. Ensure Demo Agents and Sub-buyers exist for loads
    let agents = await Agent.find({ isDeleted: false });
    if (agents.length === 0) {
      const defaultAgent = await Agent.create({
        name: "Naveen",
        phone: "9876543210",
        company: "Naveen Blue Metals",
        location: "Salem",
        commission: 25,
        status: "active"
      });
      agents = [defaultAgent];
    }

    const agent1 = agents[0];
    const agent2 = agents[1] || agents[0];
    const agent3 = agents[2] || agents[0];

    const subBuyers1 = await SubBuyer.find({ agentId: agent1._id, isDeleted: false });
    const sb1 = subBuyers1[0] ? subBuyers1[0]._id : null;
    const sb2 = subBuyers1[1] ? subBuyers1[1]._id : null;

    // 4. Seed 8 Demo Loads consuming passes through consumePassFIFO (idempotent)
    const existingLoadsCount = await Load.countDocuments();
    if (existingLoadsCount >= 8) {
      console.log(
        `[Seed Demo Passes] Already found ${existingLoadsCount} loads in database. Skipping demo load seeding to preserve pass history.`
      );
    } else {
      console.log(`[Seed Demo Passes] Seeding 8 demo loads consuming passes through FIFO...`);

      const demoLoadsPlan = [
        {
          lorryNo: "TN-28-AA-1234",
          material: "20mm Blue Metal",
          quantity: 25,
          rate: 450,
          amount: 11250,
          agentId: agent1._id,
          subBuyerId: sb1,
          notes: "Primary foundation aggregate supply"
        },
        {
          lorryNo: "TN-28-AA-5678",
          material: "40mm Aggregate",
          quantity: 30,
          rate: 420,
          amount: 12600,
          agentId: agent1._id,
          subBuyerId: sb2,
          notes: "Road laying ballast shipment"
        },
        {
          lorryNo: "TN-30-BC-9012",
          material: "M-Sand",
          quantity: 28,
          rate: 520,
          amount: 14560,
          agentId: agent2._id,
          subBuyerId: null,
          notes: "Plastering quality M-Sand"
        },
        {
          lorryNo: "TN-30-BC-3456",
          material: "P-Sand",
          quantity: 22,
          rate: 580,
          amount: 12760,
          agentId: agent2._id,
          subBuyerId: null,
          notes: "Concrete construction grade P-Sand"
        },
        {
          lorryNo: "TN-88-DE-7890",
          material: "Gravel Base",
          quantity: 35,
          rate: 320,
          amount: 11200,
          agentId: agent3._id,
          subBuyerId: null,
          notes: "Quarry site pit backfill"
        },
        {
          lorryNo: "TN-88-DE-2345",
          material: "20mm Blue Metal",
          quantity: 24,
          rate: 450,
          amount: 10800,
          agentId: agent1._id,
          subBuyerId: sb1,
          notes: "Building beam casting work"
        },
        {
          lorryNo: "TN-33-FG-6789",
          material: "12mm Blue Metal",
          quantity: 20,
          rate: 460,
          amount: 9200,
          agentId: agent2._id,
          subBuyerId: null,
          notes: "Roof slab concrete mixing"
        },
        {
          lorryNo: "TN-33-FG-0123",
          material: "M-Sand",
          quantity: 30,
          rate: 520,
          amount: 15600,
          agentId: agent3._id,
          subBuyerId: null,
          notes: "Commercial apartment project delivery"
        }
      ];

      const loadsToCreate = demoLoadsPlan.slice(0, 8 - existingLoadsCount);

      for (let i = 0; i < loadsToCreate.length; i++) {
        const item = loadsToCreate[i];
        // Consume pass through normal FIFO service
        const consumedBatch = await consumePassFIFO();

        const newLoad = await Load.create({
          date: new Date(Date.now() - (7 - i) * 3600 * 1000 * 4), // staggered over last 28 hours
          lorryNo: item.lorryNo,
          material: item.material,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          agentId: item.agentId,
          subBuyerId: item.subBuyerId,
          passBatchId: consumedBatch._id,
          notes: item.notes,
          createdBy
        });

        console.log(
          `[Seed Demo Passes] Created load ${i + 1}/8: '${newLoad.lorryNo}' (${newLoad.material}) using pass from batch '${consumedBatch.batchNo}'`
        );
      }
    }

    console.log("[Seed Demo Passes] Demo pass seeding completed successfully!");
    await mongoose.disconnect();
    console.log("[Seed Demo Passes] Disconnected from MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Demo Passes] Failed: ${error.message}`);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
};

seedDemoPasses();
