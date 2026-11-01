import ExcelJS from "exceljs";
import { Load } from "../models/Load.js";
import { Purchase } from "../models/Purchase.js";
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
