import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import express from "express";
import apiRoutes from "../routes/index.js";
import { notFoundHandler, errorHandler } from "../middleware/errorHandler.js";
import { Load } from "../models/Load.js";
import { Purchase } from "../models/Purchase.js";
import { getStartOfDayIST, getEndOfDayIST } from "../utils/date.js";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const runPhase4Tests = async () => {
  const mongoURI = process.env.MONGO_URI;
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@bluemetal.com").trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!mongoURI || !adminPassword) {
    console.error("Missing required environment variables for test execution.");
    process.exit(1);
  }

  // 1. Connect to MongoDB
  await mongoose.connect(mongoURI);

  // 2. Set up test server
  const app = express();
  app.use(express.json());
  app.use("/api", apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  const TEST_PORT = 5059;
  const server = app.listen(TEST_PORT);
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`;

  const results = {
    auth401WithoutToken: false,
    dashboardSummarySuccess: false,
    dailySeriesDaysCountMatches: false,
    totalsMatchDatabaseAggregate: false,
    backupNoPasswordHash: false,
    backupNoUsersKey: false,
    loadsXlsxValid: false,
    purchasesXlsxValid: false,
    reportPdfValid: false
  };

  try {
    // Test A: 401 without token
    const unauthRes = await fetch(`${BASE_URL}/dashboard/summary`);
    results.auth401WithoutToken = unauthRes.status === 401;

    // Log in as admin
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.token;

    if (!token) {
      throw new Error("Failed to obtain authentication token");
    }

    const authHeaders = { Authorization: `Bearer ${token}` };

    // Test B: Dashboard Summary
    const fromStr = "2026-10-01";
    const toStr = "2026-10-31"; // 31 days
    const dashRes = await fetch(`${BASE_URL}/dashboard/summary?from=${fromStr}&to=${toStr}`, {
      headers: authHeaders
    });
    const dashData = await dashRes.json();

    results.dashboardSummarySuccess = Boolean(dashData.success);
    results.dailySeriesDaysCountMatches =
      Array.isArray(dashData.data?.dailySeries) && dashData.data.dailySeries.length === 31;

    // Compare with manual DB aggregates
    const startObj = getStartOfDayIST(fromStr);
    const endObj = getEndOfDayIST(toStr);

    const [salesManualAgg, purchaseManualAgg] = await Promise.all([
      Load.aggregate([
        { $match: { date: { $gte: startObj, $lte: endObj } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
      ]),
      Purchase.aggregate([
        { $match: { date: { $gte: startObj, $lte: endObj } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    const expectedSales = salesManualAgg.length > 0 ? salesManualAgg[0].total : 0;
    const expectedLoadsCount = salesManualAgg.length > 0 ? salesManualAgg[0].count : 0;
    const expectedPurchases = purchaseManualAgg.length > 0 ? purchaseManualAgg[0].total : 0;

    results.totalsMatchDatabaseAggregate =
      dashData.data?.totalSales === expectedSales &&
      dashData.data?.loadsCount === expectedLoadsCount &&
      dashData.data?.totalPurchases === expectedPurchases &&
      dashData.data?.netBalance === expectedSales - expectedPurchases;

    // Test C: Backup Export
    const backupRes = await fetch(`${BASE_URL}/backup/export`, {
      headers: authHeaders
    });
    const backupText = await backupRes.text();
    const backupData = JSON.parse(backupText);

    results.backupNoPasswordHash = !backupText.includes("passwordHash");
    results.backupNoUsersKey =
      backupData.data?.users === undefined &&
      backupData.users === undefined &&
      backupData.meta?.counts?.users === undefined;

    // Test D: Excel Export - Loads
    const loadsXlsxRes = await fetch(`${BASE_URL}/export/loads.xlsx?from=${fromStr}&to=${toStr}`, {
      headers: authHeaders
    });
    const loadsXlsxBuf = await loadsXlsxRes.arrayBuffer();
    const loadsContentType = loadsXlsxRes.headers.get("content-type") || "";
    results.loadsXlsxValid =
      loadsXlsxRes.status === 200 &&
      loadsContentType.includes("spreadsheetml") &&
      loadsXlsxBuf.byteLength > 1000;

    // Test E: Excel Export - Purchases
    const purchasesXlsxRes = await fetch(`${BASE_URL}/export/purchases.xlsx?from=${fromStr}&to=${toStr}`, {
      headers: authHeaders
    });
    const purchasesXlsxBuf = await purchasesXlsxRes.arrayBuffer();
    const purchasesContentType = purchasesXlsxRes.headers.get("content-type") || "";
    results.purchasesXlsxValid =
      purchasesXlsxRes.status === 200 &&
      purchasesContentType.includes("spreadsheetml") &&
      purchasesXlsxBuf.byteLength > 1000;

    // Test F: PDF Export - Report
    const reportPdfRes = await fetch(`${BASE_URL}/export/report.pdf?from=${fromStr}&to=${toStr}`, {
      headers: authHeaders
    });
    const reportPdfBuf = await reportPdfRes.arrayBuffer();
    const reportPdfContentType = reportPdfRes.headers.get("content-type") || "";
    results.reportPdfValid =
      reportPdfRes.status === 200 &&
      reportPdfContentType.includes("pdf") &&
      reportPdfBuf.byteLength > 1000;
  } catch (err) {
    console.error("Test execution encountered an error:", err.message);
  } finally {
    server.close();
    await mongoose.disconnect();
  }

  // Print results strictly as booleans and counts
  console.log("=== PHASE 4 TEST RESULTS ===");
  console.log("auth401WithoutToken:", results.auth401WithoutToken);
  console.log("dashboardSummarySuccess:", results.dashboardSummarySuccess);
  console.log("dailySeriesDaysCountMatches:", results.dailySeriesDaysCountMatches);
  console.log("totalsMatchDatabaseAggregate:", results.totalsMatchDatabaseAggregate);
  console.log("backupNoPasswordHash:", results.backupNoPasswordHash);
  console.log("backupNoUsersKey:", results.backupNoUsersKey);
  console.log("loadsXlsxValid:", results.loadsXlsxValid);
  console.log("purchasesXlsxValid:", results.purchasesXlsxValid);
  console.log("reportPdfValid:", results.reportPdfValid);

  const allPassed = Object.values(results).every(Boolean);
  console.log("ALL_TESTS_PASSED:", allPassed);

  if (!allPassed) {
    process.exit(1);
  }
};

runPhase4Tests();
