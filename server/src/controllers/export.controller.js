import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { Load } from "../models/Load.js";
import { Purchase } from "../models/Purchase.js";
import { getPassSummaryData } from "../services/passService.js";
import { getStartOfDayIST, getEndOfDayIST, IST_OFFSET_MS } from "../utils/date.js";

/**
 * GET /api/export/loads.xlsx
 * Query: from, to (optional ISO dates)
 * Roles: admin, manager, viewer
 */
export const exportLoadsExcel = async (req, res) => {
  const { from, to } = req.query;
  const filter = {};
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = getStartOfDayIST(from);
    if (to) filter.date.$lte = getEndOfDayIST(to);
  }

  const loads = await Load.find(filter)
    .sort({ date: 1, createdAt: 1 })
    .populate("agentId", "name company")
    .populate("subBuyerId", "name")
    .populate("passBatchId", "batchNo")
    .lean();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Blue Metal ERP";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Loads (Sales)");

  worksheet.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Lorry No", key: "lorryNo", width: 16 },
    { header: "Agent", key: "agent", width: 22 },
    { header: "Sub-Buyer", key: "subBuyer", width: 20 },
    { header: "Material", key: "material", width: 25 },
    { header: "Quantity (Units)", key: "quantity", width: 16 },
    { header: "Rate (₹)", key: "rate", width: 14 },
    { header: "Amount (₹)", key: "amount", width: 16 },
    { header: "Pass Batch", key: "passBatch", width: 18 },
    { header: "Notes", key: "notes", width: 30 }
  ];

  // Header style
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" } // Slate-800
  };
  worksheet.getRow(1).alignment = { vertical: "middle" };

  let totalQty = 0;
  let totalAmount = 0;

  loads.forEach((load) => {
    const d = load.date ? new Date(load.date) : null;
    const dateStr = d ? new Date(d.getTime() + IST_OFFSET_MS).toISOString().split("T")[0] : "";
    const qty = Number(load.quantity || 0);
    const amt = Number(load.amount || 0);

    totalQty += qty;
    totalAmount += amt;

    const row = worksheet.addRow({
      date: dateStr,
      lorryNo: load.lorryNo || "",
      agent: load.agentId?.name || "Unknown Agent",
      subBuyer: load.subBuyerId?.name || "Direct / Unassigned",
      material: load.material || "",
      quantity: qty,
      rate: Number(load.rate || 0),
      amount: amt,
      passBatch: load.passBatchId?.batchNo || "",
      notes: load.notes || ""
    });

    row.getCell("amount").numFmt = "₹#,##0.00";
    row.getCell("rate").numFmt = "₹#,##0.00";
    row.getCell("quantity").numFmt = "#,##0.00";
  });

  // Total row at bottom
  const totalRow = worksheet.addRow({
    date: "",
    lorryNo: "",
    agent: "",
    subBuyer: "",
    material: "Total",
    quantity: totalQty,
    rate: "",
    amount: totalAmount,
    passBatch: "",
    notes: ""
  });

  totalRow.font = { bold: true };
  totalRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF1F5F9" } // Slate-100
  };
  totalRow.getCell("quantity").numFmt = "#,##0.00";
  totalRow.getCell("amount").numFmt = "₹#,##0.00";

  const nowIST = new Date(Date.now() + IST_OFFSET_MS);
  const yStr = nowIST.getUTCFullYear();
  const mStr = String(nowIST.getUTCMonth() + 1).padStart(2, "0");
  const dStr = String(nowIST.getUTCDate()).padStart(2, "0");
  const filename = `loads-export-${yStr}-${mStr}-${dStr}.xlsx`;

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
};

/**
 * GET /api/export/purchases.xlsx
 * Query: from, to (optional ISO dates)
 * Roles: admin, manager, viewer
 */
export const exportPurchasesExcel = async (req, res) => {
  const { from, to } = req.query;
  const filter = {};
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = getStartOfDayIST(from);
    if (to) filter.date.$lte = getEndOfDayIST(to);
  }

  const purchases = await Purchase.find(filter)
    .sort({ date: 1, createdAt: 1 })
    .lean();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Blue Metal ERP";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Purchases & Rent");

  worksheet.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Category", key: "category", width: 22 },
    { header: "Vendor", key: "vendor", width: 25 },
    { header: "Amount (₹)", key: "amount", width: 18 },
    { header: "Notes", key: "notes", width: 35 }
  ];

  // Header style
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" } // Slate-800
  };
  worksheet.getRow(1).alignment = { vertical: "middle" };

  let totalAmount = 0;

  purchases.forEach((p) => {
    const d = p.date ? new Date(p.date) : null;
    const dateStr = d ? new Date(d.getTime() + IST_OFFSET_MS).toISOString().split("T")[0] : "";
    const amt = Number(p.amount || 0);
    totalAmount += amt;

    const row = worksheet.addRow({
      date: dateStr,
      category: p.category || "",
      vendor: p.vendor || "",
      amount: amt,
      notes: p.notes || ""
    });

    row.getCell("amount").numFmt = "₹#,##0.00";
  });

  // Total row at bottom
  const totalRow = worksheet.addRow({
    date: "",
    category: "",
    vendor: "Total",
    amount: totalAmount,
    notes: ""
  });

  totalRow.font = { bold: true };
  totalRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF1F5F9" }
  };
  totalRow.getCell("amount").numFmt = "₹#,##0.00";

  const nowIST = new Date(Date.now() + IST_OFFSET_MS);
  const yStr = nowIST.getUTCFullYear();
  const mStr = String(nowIST.getUTCMonth() + 1).padStart(2, "0");
  const dStr = String(nowIST.getUTCDate()).padStart(2, "0");
  const filename = `purchases-export-${yStr}-${mStr}-${dStr}.xlsx`;

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
};

/**
 * GET /api/export/report.pdf
 * Query: from, to (optional ISO dates, defaults to current month in Asia/Kolkata)
 * Roles: admin, manager, viewer
 */
export const exportReportPDF = async (req, res) => {
  const { from, to } = req.query;

  let startDate;
  let endDate;

  if (from) {
    startDate = getStartOfDayIST(from);
  } else {
    const nowIST = new Date(Date.now() + IST_OFFSET_MS);
    const y = nowIST.getUTCFullYear();
    const m = nowIST.getUTCMonth();
    startDate = new Date(Date.UTC(y, m, 1) - IST_OFFSET_MS);
  }

  if (to) {
    endDate = getEndOfDayIST(to);
  } else {
    const nowIST = new Date(Date.now() + IST_OFFSET_MS);
    const y = nowIST.getUTCFullYear();
    const m = nowIST.getUTCMonth();
    endDate = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999) - IST_OFFSET_MS);
  }

  // 1. Sales & Purchases Totals
  const [salesAgg, purchasesAgg, topAgents, passSummary] = await Promise.all([
    Load.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$amount" },
          loadsCount: { $sum: 1 }
        }
      }
    ]),
    Purchase.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: "$amount" }
        }
      }
    ]),
    Load.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: "$agentId",
          total: { $sum: "$amount" }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "agents",
          localField: "_id",
          foreignField: "_id",
          as: "agent"
        }
      },
      {
        $project: {
          _id: 1,
          name: { $ifNull: [{ $arrayElemAt: ["$agent.name", 0] }, "Unknown Agent"] },
          company: { $ifNull: [{ $arrayElemAt: ["$agent.company", 0] }, ""] },
          total: 1
        }
      }
    ]),
    getPassSummaryData()
  ]);

  const totalSales = salesAgg.length > 0 ? salesAgg[0].totalSales : 0;
  const loadsCount = salesAgg.length > 0 ? salesAgg[0].loadsCount : 0;
  const totalPurchases = purchasesAgg.length > 0 ? purchasesAgg[0].totalPurchases : 0;
  const netBalance = totalSales - totalPurchases;

  // Format dates for display
  const startStr = new Date(startDate.getTime() + IST_OFFSET_MS).toISOString().split("T")[0];
  const endStr = new Date(endDate.getTime() + IST_OFFSET_MS).toISOString().split("T")[0];

  const nowIST = new Date(Date.now() + IST_OFFSET_MS);
  const genStr = nowIST.toISOString().replace("T", " ").substring(0, 19) + " IST";
  const filename = `blue-metal-report-${startStr}-to-${endStr}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  doc.pipe(res);

  // --- Title & Header ---
  doc.rect(40, 40, 515, 60).fill("#0F172A"); // Dark banner
  doc.fillColor("#FFFFFF").fontSize(16).font("Helvetica-Bold")
    .text("BLUE METAL ERP — EXECUTIVE REPORT", 55, 52, { align: "left" });
  doc.fillColor("#94A3B8").fontSize(9).font("Helvetica")
    .text(`Period: ${startStr} to ${endStr}  |  Generated: ${genStr}`, 55, 74, { align: "left" });

  let y = 115;

  // --- Section 1: Financial & Operational Totals ---
  doc.fillColor("#0F172A").fontSize(11).font("Helvetica-Bold")
    .text("1. FINANCIAL & OPERATIONAL SUMMARY", 40, y);
  y += 18;

  const cardWidth = 120;
  const cardHeight = 50;
  const gap = 11;

  const kpis = [
    { label: "Total Sales", val: `Rs. ${totalSales.toLocaleString("en-IN")}`, col: "#0284C7" },
    { label: "Purchases & Rent", val: `Rs. ${totalPurchases.toLocaleString("en-IN")}`, col: "#E11D48" },
    { label: "Net Balance", val: `Rs. ${netBalance.toLocaleString("en-IN")}`, col: netBalance >= 0 ? "#16A34A" : "#DC2626" },
    { label: "Dispatched Loads", val: `${loadsCount.toLocaleString("en-IN")} Loads`, col: "#D97706" }
  ];

  kpis.forEach((kpi, idx) => {
    const x = 40 + idx * (cardWidth + gap);
    doc.rect(x, y, cardWidth, cardHeight).fillAndStroke("#F8FAFC", "#E2E8F0");
    doc.fillColor("#64748B").fontSize(8).font("Helvetica").text(kpi.label, x + 8, y + 8);
    doc.fillColor(kpi.col).fontSize(11).font("Helvetica-Bold").text(kpi.val, x + 8, y + 26);
  });

  y += cardHeight + 25;

  // --- Section 2: Transit Pass & Treasury Inventory ---
  doc.fillColor("#0F172A").fontSize(11).font("Helvetica-Bold")
    .text("2. GOVT TRANSIT PASS & TREASURY INVENTORY", 40, y);
  y += 18;

  const passKpis = [
    { label: "Total Bought (Govt)", val: `${passSummary.total || 0} passes` },
    { label: "Active Remaining", val: `${passSummary.active || 0} passes` },
    { label: "Expiring Soon", val: `${passSummary.expiringSoon || 0} passes` },
    { label: "Treasury Balance", val: `${passSummary.treasuryBalance || 0} passes` }
  ];

  passKpis.forEach((pk, idx) => {
    const x = 40 + idx * (cardWidth + gap);
    doc.rect(x, y, cardWidth, 42).fillAndStroke("#F8FAFC", "#E2E8F0");
    doc.fillColor("#64748B").fontSize(8).font("Helvetica").text(pk.label, x + 8, y + 7);
    doc.fillColor("#0F172A").fontSize(11).font("Helvetica-Bold").text(pk.val, x + 8, y + 22);
  });

  y += 42 + 25;

  // --- Section 3: Top Performing Agents ---
  doc.fillColor("#0F172A").fontSize(11).font("Helvetica-Bold")
    .text("3. TOP 5 PERFORMING AGENTS", 40, y);
  y += 18;

  // Table Header
  doc.rect(40, y, 515, 20).fill("#1E293B");
  doc.fillColor("#FFFFFF").fontSize(8).font("Helvetica-Bold");
  doc.text("Rank", 50, y + 6);
  doc.text("Agent Name", 90, y + 6);
  doc.text("Company", 230, y + 6);
  doc.text("Sales Amount", 380, y + 6, { width: 90, align: "right" });
  doc.text("Share (%)", 480, y + 6, { width: 65, align: "right" });
  y += 20;

  if (topAgents.length === 0) {
    doc.rect(40, y, 515, 25).fillAndStroke("#FFFFFF", "#E2E8F0");
    doc.fillColor("#94A3B8").fontSize(9).font("Helvetica").text("No sales dispatches in selected date range.", 50, y + 8);
    y += 25;
  } else {
    topAgents.forEach((agent, i) => {
      const share = totalSales > 0 ? ((agent.total / totalSales) * 100).toFixed(1) : "0.0";
      const bg = i % 2 === 0 ? "#FFFFFF" : "#F8FAFC";
      doc.rect(40, y, 515, 20).fillAndStroke(bg, "#E2E8F0");

      doc.fillColor("#334155").fontSize(8).font("Helvetica");
      doc.text(`#${i + 1}`, 50, y + 6);
      doc.font("Helvetica-Bold").text(agent.name || "Unknown Agent", 90, y + 6);
      doc.font("Helvetica").text(agent.company || "-", 230, y + 6);
      doc.font("Helvetica-Bold").text(`Rs. ${Number(agent.total).toLocaleString("en-IN")}`, 380, y + 6, { width: 90, align: "right" });
      doc.font("Helvetica").text(`${share}%`, 480, y + 6, { width: 65, align: "right" });
      y += 20;
    });
  }

  // --- Footer ---
  const footerY = 770;
  doc.rect(40, footerY - 5, 515, 1).fill("#CBD5E1");
  doc.fillColor("#94A3B8").fontSize(8).font("Helvetica")
    .text("Blue Metal ERP • Automated Executive Report • Generated securely", 40, footerY + 5, { align: "center", width: 515 });

  doc.end();
};
