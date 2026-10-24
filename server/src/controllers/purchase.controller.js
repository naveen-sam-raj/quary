import { Purchase, PURCHASE_CATEGORIES } from "../models/Purchase.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * GET /api/purchases
 * Query: from, to, category, search, page, limit
 * Returns items, total, totalAmount (sum of filtered amount), categoryTotals, page, pages
 */
export const getPurchases = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};

  // Date range filtering
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) {
      const fromDate = new Date(req.query.from);
      if (!isNaN(fromDate.getTime())) {
        filter.date.$gte = fromDate;
      }
    }
    if (req.query.to) {
      const toDate = new Date(req.query.to);
      if (!isNaN(toDate.getTime())) {
        // If date-only string like YYYY-MM-DD, include until end of day
        if (req.query.to.trim().length <= 10) {
          toDate.setUTCHours(23, 59, 59, 999);
        }
        filter.date.$lte = toDate;
      }
    }
  }

  // Category filter
  if (req.query.category && PURCHASE_CATEGORIES.includes(req.query.category)) {
    filter.category = req.query.category;
  }

  // Search filter (vendor or notes)
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search.trim(), "i");
    filter.$or = [{ vendor: searchRegex }, { notes: searchRegex }];
  }

  // Aggregate sum of amount & category totals for the filtered results
  const [items, total, totalAmountAgg, categoryTotalsAgg] = await Promise.all([
    Purchase.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
    Purchase.countDocuments(filter),
    Purchase.aggregate([
      { $match: filter },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
    ]),
    Purchase.aggregate([
      { $match: filter },
      { $group: { _id: "$category", total: { $sum: "$amount" } } }
    ])
  ]);

  const totalAmount = totalAmountAgg.length > 0 ? totalAmountAgg[0].totalAmount : 0;

  // Initialize category totals map
  const categoryTotals = PURCHASE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = 0;
    return acc;
  }, {});

  categoryTotalsAgg.forEach((entry) => {
    if (categoryTotals.hasOwnProperty(entry._id)) {
      categoryTotals[entry._id] = entry.total;
    }
  });

  const pages = Math.ceil(total / limit) || 1;

  return sendSuccess(
    res,
    {
      items,
      total,
      totalAmount,
      categoryTotals,
      page,
      pages
    },
    "Purchases retrieved successfully"
  );
};

/**
 * GET /api/purchases/:id
 */
export const getPurchaseById = async (req, res) => {
  const { id } = req.params;

  const purchase = await Purchase.findById(id);
  if (!purchase) {
    return sendError(res, "Purchase not found", 404);
  }

  return sendSuccess(res, { purchase }, "Purchase retrieved successfully");
};

/**
 * POST /api/purchases
 * Admin and Manager only
 */
export const createPurchase = async (req, res) => {
  const { date, category, vendor, amount, notes } = req.body;

  const purchase = await Purchase.create({
    date: new Date(date),
    category,
    vendor,
    amount,
    notes: notes || ""
  });

  return sendSuccess(res, { purchase }, "Purchase created successfully", 201);
};

/**
 * PUT /api/purchases/:id
 * Admin and Manager only
 */
export const updatePurchase = async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  if (updates.date) {
    updates.date = new Date(updates.date);
  }

  const purchase = await Purchase.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true
  });

  if (!purchase) {
    return sendError(res, "Purchase not found", 404);
  }

  return sendSuccess(res, { purchase }, "Purchase updated successfully");
};

/**
 * DELETE /api/purchases/:id
 * Admin only (hard delete)
 */
export const deletePurchase = async (req, res) => {
  const { id } = req.params;

  const purchase = await Purchase.findByIdAndDelete(id);
  if (!purchase) {
    return sendError(res, "Purchase not found", 404);
  }

  return sendSuccess(res, null, "Purchase deleted successfully");
};
