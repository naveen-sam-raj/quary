import { Load } from "../models/Load.js";
import { Purchase } from "../models/Purchase.js";
import { getPassSummaryData } from "../services/passService.js";
import { getStartOfDayIST, getEndOfDayIST, IST_OFFSET_MS } from "../utils/date.js";
import { sendSuccess } from "../utils/response.js";

/**
 * GET /api/dashboard/summary
 * Query: from, to (ISO dates, defaults to current month in Asia/Kolkata timezone)
 * Roles: admin, manager, viewer
 */
export const getDashboardSummary = async (req, res) => {
  const { from, to } = req.query;

  let startDate;
  let endDate;

  if (from) {
    startDate = getStartOfDayIST(from);
  } else {
    // Current month start in Asia/Kolkata
    const nowIST = new Date(Date.now() + IST_OFFSET_MS);
    const y = nowIST.getUTCFullYear();
    const m = nowIST.getUTCMonth();
    startDate = new Date(Date.UTC(y, m, 1) - IST_OFFSET_MS);
  }

  if (to) {
    endDate = getEndOfDayIST(to);
  } else {
    // Current month end in Asia/Kolkata
    const nowIST = new Date(Date.now() + IST_OFFSET_MS);
    const y = nowIST.getUTCFullYear();
    const m = nowIST.getUTCMonth();
    endDate = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999) - IST_OFFSET_MS);
  }

  // 1. Sales & Loads Aggregation
  const salesPromise = Load.aggregate([
    { $match: { date: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$amount" },
        loadsCount: { $sum: 1 }
      }
    }
  ]);

  // 2. Purchases Aggregation
  const purchasesPromise = Purchase.aggregate([
    { $match: { date: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: null,
        totalPurchases: { $sum: "$amount" }
      }
    }
  ]);

  // 3. Top 5 Agents by Sales
  const topAgentsPromise = Load.aggregate([
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
        agentId: "$_id",
        name: { $ifNull: [{ $arrayElemAt: ["$agent.name", 0] }, "Unknown Agent"] },
        total: 1
      }
    }
  ]);

  // 4. Daily Revenue Aggregation (Loads)
  const dailyRevenuePromise = Load.aggregate([
    { $match: { date: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "+05:30" } },
        revenue: { $sum: "$amount" }
      }
    }
  ]);

  // 5. Daily Expenses Aggregation (Purchases)
  const dailyExpensePromise = Purchase.aggregate([
    { $match: { date: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "+05:30" } },
        expense: { $sum: "$amount" }
      }
    }
  ]);

  // 6. Passes Summary Data (reusing existing pass summary service)
  const passSummaryPromise = getPassSummaryData();

  const [
    salesAgg,
    purchasesAgg,
    topAgents,
    dailyRevenueAgg,
    dailyExpenseAgg,
    passSummary
  ] = await Promise.all([
    salesPromise,
    purchasesPromise,
    topAgentsPromise,
    dailyRevenuePromise,
    dailyExpensePromise,
    passSummaryPromise
  ]);

  const totalSales = salesAgg.length > 0 ? salesAgg[0].totalSales : 0;
  const loadsCount = salesAgg.length > 0 ? salesAgg[0].loadsCount : 0;
  const totalPurchases = purchasesAgg.length > 0 ? purchasesAgg[0].totalPurchases : 0;
  const netBalance = totalSales - totalPurchases;

  // Build daily series for every day in range (zero-filled)
  const revenueMap = new Map(dailyRevenueAgg.map((r) => [r._id, r.revenue]));
  const expenseMap = new Map(dailyExpenseAgg.map((e) => [e._id, e.expense]));

  const dailySeries = [];
  const currentCursor = new Date(startDate.getTime());

  while (currentCursor <= endDate) {
    const istTime = new Date(currentCursor.getTime() + IST_OFFSET_MS);
    const yStr = istTime.getUTCFullYear();
    const mStr = String(istTime.getUTCMonth() + 1).padStart(2, "0");
    const dStr = String(istTime.getUTCDate()).padStart(2, "0");
    const dateKey = `${yStr}-${mStr}-${dStr}`;

    dailySeries.push({
      date: dateKey,
      revenue: revenueMap.get(dateKey) || 0,
      expense: expenseMap.get(dateKey) || 0
    });

    currentCursor.setTime(currentCursor.getTime() + 24 * 60 * 60 * 1000);
  }

  const passes = {
    total: passSummary.total,
    active: passSummary.active,
    expiringSoon: passSummary.expiringSoon,
    treasuryBalance: passSummary.treasuryBalance
  };

  return sendSuccess(
    res,
    {
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      totalSales,
      totalPurchases,
      netBalance,
      loadsCount,
      passes,
      topAgents,
      dailySeries
    },
    "Dashboard summary retrieved successfully"
  );
};
