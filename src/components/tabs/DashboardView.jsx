import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  ShoppingCart,
  FileCheck2,
  Wallet,
  Truck,
  Landmark,
  Calendar,
  Download,
  Users,
  AlertCircle,
  RefreshCw,
  Award,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import KpiCard from '../KpiCard';
import SalesAreaChart from '../SalesAreaChart';
import { useDashboardSummary } from '../../hooks/useDashboardSummary';
import { downloadReportPdf } from '../../utils/exportHelpers';

export default function DashboardView({
  sales = [],
  purchases = [],
  passBatches = [],
  purchaseCategoryStats = [],
  setActiveTab,
  formatDate
}) {
  const [rangePreset, setRangePreset] = useState('THIS_MONTH'); // 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM'
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Compute IST Date presets
  const datePresets = useMemo(() => {
    const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const y = nowIST.getUTCFullYear();
    const m = nowIST.getUTCMonth(); // 0 to 11

    // This month (e.g. 2026-11-01 to 2026-11-30)
    const thisMonthStart = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDayThisMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const thisMonthEnd = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDayThisMonth).padStart(2, '0')}`;

    // Last month (e.g. 2026-10-01 to 2026-10-31)
    const prevMonthDate = new Date(Date.UTC(y, m - 1, 1));
    const py = prevMonthDate.getUTCFullYear();
    const pm = prevMonthDate.getUTCMonth();
    const lastMonthStart = `${py}-${String(pm + 1).padStart(2, '0')}-01`;
    const lastDayPrevMonth = new Date(Date.UTC(py, pm + 1, 0)).getUTCDate();
    const lastMonthEnd = `${py}-${String(pm + 1).padStart(2, '0')}-${String(lastDayPrevMonth).padStart(2, '0')}`;

    return {
      thisMonth: { from: thisMonthStart, to: thisMonthEnd, label: 'This Month' },
      lastMonth: { from: lastMonthStart, to: lastMonthEnd, label: 'Last Month' }
    };
  }, []);

  // Determine active query parameters
  const { activeFrom, activeTo } = useMemo(() => {
    if (rangePreset === 'LAST_MONTH') {
      return { activeFrom: datePresets.lastMonth.from, activeTo: datePresets.lastMonth.to };
    }
    if (rangePreset === 'CUSTOM') {
      return { activeFrom: customFrom || undefined, activeTo: customTo || undefined };
    }
    // THIS_MONTH: backend defaults to current month in Asia/Kolkata when no params are given
    return { activeFrom: undefined, activeTo: undefined };
  }, [rangePreset, customFrom, customTo, datePresets]);

  // Hook fetching summary from API
  const { data, isLoading, isError, error, refetch } = useDashboardSummary(activeFrom, activeTo);

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      await downloadReportPdf(activeFrom, activeTo);
    } catch {
      // Error is toasted inside helper
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Safe fallback values
  const totalSales = Number(data?.totalSales || 0);
  const totalPurchases = Number(data?.totalPurchases || 0);
  const netBalance = Number(data?.netBalance || 0);
  const loadsCount = Number(data?.loadsCount || 0);
  const passes = data?.passes || { total: 0, active: 0, expiringSoon: 0, treasuryBalance: 0 };
  const topAgents = Array.isArray(data?.topAgents) ? data.topAgents : [];
  const dailySeries = Array.isArray(data?.dailySeries) ? data.dailySeries : [];

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="space-y-6"
    >
      {/* Dashboard Header Bar: Title, Range Filter & PDF Export */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#111827] border border-white/[0.07] rounded-xl p-4 sm:p-5 card-shine">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Quarry Executive Dashboard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time analytics for revenue, dispatches, govt transit passes & expense ledger
          </p>
        </div>

        {/* Toolbar: Date Range Picker & Export PDF */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Buttons */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-white/[0.08] text-xs">
            <button
              onClick={() => setRangePreset('THIS_MONTH')}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                rangePreset === 'THIS_MONTH'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setRangePreset('LAST_MONTH')}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                rangePreset === 'LAST_MONTH'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => setRangePreset('CUSTOM')}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                rangePreset === 'CUSTOM'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Custom Date Inputs */}
          {rangePreset === 'CUSTOM' && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-1 rounded-lg border border-white/[0.08] text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none [color-scheme:dark]"
                placeholder="Start"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none [color-scheme:dark]"
                placeholder="End"
              />
            </div>
          )}

          {/* PDF Export Button */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs transition shadow-sm disabled:opacity-50 cursor-pointer"
            title="Download Executive PDF Report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingPdf ? 'Exporting...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Error State Banner */}
      {isError && (
        <div className="rounded-xl p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error?.response?.data?.message || 'Failed to load dashboard summary from server'}</span>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-md font-semibold transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="space-y-6">
          {/* Skeleton KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="rounded-xl p-5 bg-[#111827] border border-white/[0.07] animate-pulse space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 bg-slate-800 rounded" />
                  <div className="h-7 w-7 bg-slate-800 rounded-lg" />
                </div>
                <div className="h-6 w-24 bg-slate-800 rounded" />
                <div className="h-3 w-16 bg-slate-800 rounded" />
              </div>
            ))}
          </div>

          {/* Skeleton Chart */}
          <div className="rounded-xl p-6 bg-[#111827] border border-white/[0.07] animate-pulse space-y-4">
            <div className="h-4 w-48 bg-slate-800 rounded" />
            <div className="h-64 bg-slate-800/40 rounded-lg" />
          </div>

          {/* Skeleton Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl p-6 bg-[#111827] border border-white/[0.07] animate-pulse space-y-3">
              <div className="h-4 w-40 bg-slate-800 rounded" />
              <div className="space-y-2 pt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 bg-slate-800/50 rounded" />
                ))}
              </div>
            </div>
            <div className="rounded-xl p-6 bg-[#111827] border border-white/[0.07] animate-pulse space-y-3">
              <div className="h-4 w-32 bg-slate-800 rounded" />
              <div className="h-32 bg-slate-800/50 rounded" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 6 Responsive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* 1. Total Quarry Sales */}
            <KpiCard
              title="Quarry Sales"
              value={`₹${totalSales.toLocaleString('en-IN')}`}
              subValue={`${loadsCount} loads dispatched`}
              icon={TrendingUp}
              trend={{ text: 'Revenue', isPositive: true }}
              accentColor="emerald"
              sparklineData={
                dailySeries.length > 0 ? dailySeries.map((d) => d.revenue) : [10, 15, 20, 25, 30]
              }
              onClick={() => setActiveTab('sales')}
            />

            {/* 2. Purchases & Rent */}
            <KpiCard
              title="Purchases & Rent"
              value={`₹${totalPurchases.toLocaleString('en-IN')}`}
              subValue="Quarry expenditure"
              icon={ShoppingCart}
              trend={{ text: 'Outflow', isNegative: true }}
              accentColor="rose"
              sparklineData={
                dailySeries.length > 0 ? dailySeries.map((d) => d.expense) : [5, 10, 8, 15, 12]
              }
              onClick={() => setActiveTab('purchase')}
            />

            {/* 3. Net Quarry Balance */}
            <KpiCard
              title="Net Balance"
              value={`₹${netBalance.toLocaleString('en-IN')}`}
              subValue="Sales - Purchases"
              icon={Wallet}
              trend={{
                text: netBalance >= 0 ? 'Margin positive' : 'Deficit',
                isPositive: netBalance >= 0,
                isNegative: netBalance < 0
              }}
              accentColor={netBalance >= 0 ? 'emerald' : 'rose'}
              sparklineData={
                dailySeries.length > 0
                  ? dailySeries.map((d) => d.revenue - d.expense)
                  : [5, 12, 10, 18, 24]
              }
            />

            {/* 4. Dispatched Loads */}
            <KpiCard
              title="Dispatched Loads"
              value={`${loadsCount}`}
              subValue="Trips completed"
              icon={Truck}
              trend={{ text: 'Active loads', isPositive: true }}
              accentColor="amber"
              sparklineData={[3, 5, 4, 8, 7, 9, 12]}
              onClick={() => setActiveTab('sales')}
            />

            {/* 5. Govt Transit Passes */}
            <KpiCard
              title="Transit Passes"
              value={`${passes.active}`}
              subValue={`${passes.total} total registered`}
              icon={FileCheck2}
              trend={{ text: `${passes.expiringSoon} expiring`, isNegative: passes.expiringSoon > 0 }}
              accentColor="amber"
              extraBadge={passes.expiringSoon > 0 ? `${passes.expiringSoon} alert` : undefined}
              sparklineData={[40, 38, 35, 30, 28, 25]}
              onClick={() => setActiveTab('pass')}
            />

            {/* 6. Treasury Reserve Balance */}
            <KpiCard
              title="Treasury Reserve"
              value={`${passes.treasuryBalance}`}
              subValue="Sam Blue Metal Vault"
              icon={Landmark}
              trend={{ text: 'Reserve stock', isPositive: true }}
              accentColor="blue"
              sparklineData={[15, 20, 25, 20, 30, 28]}
              onClick={() => setActiveTab('treasury')}
            />
          </div>

          {/* SaaS Area Chart: Revenue vs Expenses dailySeries from Backend */}
          <SalesAreaChart dailySeries={dailySeries} />

          {/* Two Column Section: Top 5 Agents & Cost Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Top 5 Performing Agents */}
            <div className="lg:col-span-2 rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Top 5 Performing Agents</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Highest revenue contributors in selected date range
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('agents')}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Manage Agents</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {topAgents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No sales recorded for this date range.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.05]">
                        <th className="pb-3 px-3">Rank</th>
                        <th className="pb-3 px-3">Agent</th>
                        <th className="pb-3 px-3 text-right">Revenue</th>
                        <th className="pb-3 px-3 text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {topAgents.map((agent, idx) => {
                        const share = totalSales > 0 ? ((agent.total / totalSales) * 100).toFixed(1) : 0;
                        const rankBadges = [
                          'bg-amber-500/20 text-amber-300 border-amber-500/40',
                          'bg-slate-300/20 text-slate-200 border-slate-300/40',
                          'bg-amber-700/20 text-amber-400 border-amber-700/40',
                          'bg-slate-800 text-slate-400 border-slate-700',
                          'bg-slate-800 text-slate-400 border-slate-700'
                        ];

                        return (
                          <tr key={agent._id || idx} className="hover:bg-slate-800/30 transition">
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold border ${rankBadges[idx] || rankBadges[3]}`}
                              >
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-semibold text-white">{agent.name}</span>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-emerald-400 tabular-nums">
                              ₹{Number(agent.total || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="inline-flex items-center gap-2">
                                <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                  <div
                                    className="bg-emerald-400 h-full rounded-full"
                                    style={{ width: `${Math.min(Number(share), 100)}%` }}
                                  />
                                </div>
                                <span className="text-slate-300 font-medium tabular-nums">{share}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right Column: Cost Distribution Breakdown */}
            <div className="rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
                  <h3 className="text-sm font-bold text-white tracking-tight">Cost Distribution</h3>
                  <span className="text-[10px] text-slate-400 font-medium">Expense categories</span>
                </div>

                <div className="space-y-3.5">
                  {purchaseCategoryStats.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      No purchase entries recorded yet.
                    </div>
                  ) : (
                    purchaseCategoryStats.map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-300">{item.category}</span>
                          <span className="font-semibold text-white tabular-nums">
                            ₹{Number(item.total || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-rose-500 to-amber-500 h-full rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('purchase')}
                className="mt-6 w-full py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-200 border border-white/[0.06] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Manage All Quarry Purchases</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
