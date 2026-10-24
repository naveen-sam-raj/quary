import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

// Ensure .env is loaded from server root regardless of where command is run
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const seedAdmin = async () => {
  const mongoURI = process.env.MONGO_URI;
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@bluemetal.com").trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@123";
  const adminName = process.env.SEED_ADMIN_NAME || "System Admin";

  if (!mongoURI) {
    console.error("[Seed] Error: MONGO_URI is missing in environment variables.");
    process.exit(1);
  }

  try {
    console.log("[Seed] Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("[Seed] Connected to database.");

    // Check if admin user already exists
    const existingUser = await User.findOne({ email: adminEmail });

    if (existingUser) {
      console.log(`[Seed] Notice: Admin user already exists with email: ${adminEmail}. Skipping creation.`);
      await mongoose.disconnect();
      console.log("[Seed] Disconnected from MongoDB. Seed completed.");
      process.exit(0);
    }

    // Hash the seed admin password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    const newAdmin = await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "admin"
    });

    console.log(`[Seed] Success: Admin user created successfully!`);
    console.log(`[Seed] Details -> Email: ${newAdmin.email} | Role: ${newAdmin.role} | ID: ${newAdmin._id}`);

    await mongoose.disconnect();
    console.log("[Seed] Disconnected from MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Failed to seed admin user: ${error.message}`);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
};

seedAdmin();
