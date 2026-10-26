import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const run = async () => {
  const mongoURI = process.env.MONGO_URI;
  const viewerEmail = (process.env.SEED_VIEWER_EMAIL || process.env.VIEWER_EMAIL || "").trim().toLowerCase();
  const viewerPassword = process.env.SEED_VIEWER_PASSWORD || process.env.VIEWER_PASSWORD;

  if (!mongoURI || !viewerEmail || !viewerPassword) {
    console.error("[Seed Viewer] MONGO_URI and VIEWER_EMAIL / VIEWER_PASSWORD (or SEED_VIEWER_*) must be set in .env");
    process.exit(1);
  }
  const email = viewerEmail;
  try {
    await mongoose.connect(MONGO_URI);
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`[Seed Viewer] Already exists: ${email}. Skipping.`);
    } else {
      const passwordHash = await bcrypt.hash(VIEWER_PASSWORD, 10);
      const u = await User.create({ name: "Viewer", email, passwordHash, role: "viewer" });
      console.log(`[Seed Viewer] Created: ${u.email} | Role: ${u.role}`);
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error(`[Seed Viewer] Failed: ${e.message}`);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
};
run();
