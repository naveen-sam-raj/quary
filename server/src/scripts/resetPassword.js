import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env");
const credPath = path.resolve(__dirname, "../../.new-credentials.txt");

dotenv.config({ path: envPath });

const run = async () => {
  const mongoURI = process.env.MONGO_URI;
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@bluemetal.com").trim().toLowerCase();
  const viewerEmail = (process.env.SEED_VIEWER_EMAIL || process.env.VIEWER_EMAIL || "viewer@bluemetal.com").trim().toLowerCase();

  if (!mongoURI) {
    console.error("MONGO_URI is missing in environment variables.");
    process.exit(1);
  }

  // 1. Generate two new strong random passwords (24+ chars, hex or base64url so .env-safe)
  // Using 32 bytes hex = 64 characters of [0-9a-f]
  const adminPassword = crypto.randomBytes(32).toString("hex");
  const viewerPassword = crypto.randomBytes(32).toString("hex");

  // bcrypt.hash with 12 rounds
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const viewerPasswordHash = await bcrypt.hash(viewerPassword, 12);

  let connected = false;
  let adminUpdated = false;
  let viewerUpdated = false;

  try {
    await mongoose.connect(mongoURI);
    connected = true;

    // Update passwordHash for the admin and viewer users (find by email)
    const adminUser = await User.findOneAndUpdate(
      { email: adminEmail },
      { passwordHash: adminPasswordHash },
      { new: true }
    );
    if (adminUser) {
      adminUpdated = true;
    }

    const viewerUser = await User.findOneAndUpdate(
      { email: viewerEmail },
      { passwordHash: viewerPasswordHash },
      { new: true }
    );
    if (viewerUser) {
      viewerUpdated = true;
    }

    await mongoose.disconnect();
  } catch (err) {
    try {
      await mongoose.disconnect();
    } catch {}
    console.error("Database operation failed:", err.message);
    process.exit(1);
  }

  // 2. The script writes the two plaintext passwords ONLY into server/.new-credentials.txt (chmod 600)
  // in the form "ADMIN_EMAIL / password" and "VIEWER_EMAIL / password".
  const credsContent = `${adminEmail} / ${adminPassword}\n${viewerEmail} / ${viewerPassword}\n`;
  fs.writeFileSync(credPath, credsContent, { mode: 0o600 });
  try {
    fs.chmodSync(credPath, 0o600);
  } catch {}

  // 3. Update SEED_ADMIN_PASSWORD and SEED_VIEWER_PASSWORD in .env to the new values, and delete the NEW_ADMIN_PASSWORD line from .env.
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const lines = envContent.split(/\r?\n/);
    const updatedLines = [];
    let hasAdminPw = false;
    let hasViewerPw = false;
    let hasViewerEmail = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("NEW_ADMIN_PASSWORD=")) {
        continue;
      }
      if (trimmed.startsWith("SEED_ADMIN_PASSWORD=")) {
        updatedLines.push(`SEED_ADMIN_PASSWORD=${adminPassword}`);
        hasAdminPw = true;
        continue;
      }
      if (trimmed.startsWith("SEED_VIEWER_PASSWORD=") || trimmed.startsWith("VIEWER_PASSWORD=")) {
        updatedLines.push(`SEED_VIEWER_PASSWORD=${viewerPassword}`);
        hasViewerPw = true;
        continue;
      }
      if (trimmed.startsWith("SEED_VIEWER_EMAIL=")) {
        hasViewerEmail = true;
        updatedLines.push(line);
        continue;
      }
      updatedLines.push(line);
    }

    if (!hasAdminPw) {
      updatedLines.push(`SEED_ADMIN_PASSWORD=${adminPassword}`);
    }
    if (!hasViewerPw) {
      updatedLines.push(`SEED_VIEWER_PASSWORD=${viewerPassword}`);
    }
    if (!hasViewerEmail && viewerEmail) {
      updatedLines.push(`SEED_VIEWER_EMAIL=${viewerEmail}`);
    }

    fs.writeFileSync(envPath, updatedLines.join("\n"));
  }

  // Output booleans and lengths ONLY (STRICT SECURITY RULE: no passwords or URIs)
  console.log("DB connected:", connected);
  console.log("Admin user updated:", adminUpdated);
  console.log("Viewer user updated:", viewerUpdated);
  console.log("Credentials file exists:", fs.existsSync(credPath));
  console.log("Admin password length:", adminPassword.length);
  console.log("Viewer password length:", viewerPassword.length);
};

run();
