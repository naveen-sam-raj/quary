import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { Agent } from "../models/Agent.js";
import { SubBuyer } from "../models/SubBuyer.js";
import { Purchase } from "../models/Purchase.js";

// Ensure .env is loaded from server root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const seedDemo = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error("[Seed Demo] Error: MONGO_URI is missing in environment variables.");
    process.exit(1);
  }

  try {
    console.log("[Seed Demo] Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("[Seed Demo] Connected to database.");

    // 1. Seed Demo Agents
    const demoAgentsData = [
      {
        name: "Naveen",
        phone: "9876543210",
        company: "Naveen Blue Metals",
        location: "Salem",
        commission: 25,
        openingBalance: 0,
        status: "active",
        notes: "Primary distributor for Salem region",
        subBuyers: [
          { name: "Sam", phone: "9876510001", location: "Salem" },
          { name: "Raj", phone: "9876510002", location: "Namakkal" },
          { name: "Kumar", phone: "9876510003", location: "Attur" },
          { name: "Bala", phone: "9876510004", location: "Rasipuram" }
        ]
      },
      {
        name: "Karthik",
        phone: "9876543211",
        company: "Karthik Transports",
        location: "Namakkal",
        commission: 20,
        openingBalance: 5000,
        status: "active",
        notes: "Fleet partner & logistics agent",
        subBuyers: [
          { name: "Mani", phone: "9876510005", location: "Namakkal" },
          { name: "Surya", phone: "9876510006", location: "Erode" },
          { name: "Vignesh", phone: "9876510007", location: "Karur" }
        ]
      },
      {
        name: "Murugan Agencies",
        phone: "9876543212",
        company: "Murugan Agencies",
        location: "Erode",
        commission: 15,
        openingBalance: 0,
        status: "active",
        notes: "Direct wholesale contractor",
        subBuyers: []
      }
    ];

    for (const agentData of demoAgentsData) {
      let agent = await Agent.findOne({ phone: agentData.phone, isDeleted: false });

      if (agent) {
        console.log(`[Seed Demo] Agent '${agentData.name}' (${agentData.phone}) already exists. Skipping.`);
      } else {
        const { subBuyers, ...agentFields } = agentData;
        agent = await Agent.create(agentFields);
        console.log(`[Seed Demo] Created agent: '${agent.name}' (ID: ${agent._id})`);
      }

      // Seed sub-buyers for this agent
      for (const sb of agentData.subBuyers) {
        const existingSb = await SubBuyer.findOne({
          agentId: agent._id,
          name: sb.name,
          isDeleted: false
        });

        if (existingSb) {
          console.log(`[Seed Demo]   Sub-buyer '${sb.name}' under '${agent.name}' already exists. Skipping.`);
        } else {
          const newSb = await SubBuyer.create({
            agentId: agent._id,
            name: sb.name,
            phone: sb.phone,
            location: sb.location
          });
          console.log(`[Seed Demo]   Created sub-buyer: '${newSb.name}' (ID: ${newSb._id})`);
        }
      }
    }

    // 2. Seed 5 Sample Purchases
    const now = new Date();
    const demoPurchasesData = [
      {
        date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        category: "JCB",
        vendor: "ABC Earthmovers",
        amount: 18500,
        notes: "JCB Rent for quarry site pit clearing"
      },
      {
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        category: "Food",
        vendor: "Annapurna Mess",
        amount: 8400,
        notes: "Food Rent - Quarry staff monthly mess charges"
      },
      {
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        category: "Machinery",
        vendor: "Kovai Heavy Equipments",
        amount: 34000,
        notes: "Hitachi Rent for rock excavation"
      },
      {
        date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        category: "Diesel",
        vendor: "HPCL Fuel Station",
        amount: 37600,
        notes: "Diesel supply 400L for heavy vehicles"
      },
      {
        date: now, // Today
        category: "Blasting",
        vendor: "Salem Explosives & Blasting",
        amount: 25000,
        notes: "Blasting charges and safety detonators"
      }
    ];

    for (const purchaseData of demoPurchasesData) {
      const existingPurchase = await Purchase.findOne({
        category: purchaseData.category,
        vendor: purchaseData.vendor,
        amount: purchaseData.amount
      });

      if (existingPurchase) {
        console.log(`[Seed Demo] Purchase '${purchaseData.vendor}' (${purchaseData.category} - Rs.${purchaseData.amount}) already exists. Skipping.`);
      } else {
        const newPurchase = await Purchase.create(purchaseData);
        console.log(`[Seed Demo] Created purchase: '${newPurchase.vendor}' (${newPurchase.category} - Rs.${newPurchase.amount})`);
      }
    }

    console.log("[Seed Demo] Demo seeding finished successfully!");
    await mongoose.disconnect();
    console.log("[Seed Demo] Disconnected from MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Demo] Failed: ${error.message}`);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
};

seedDemo();
