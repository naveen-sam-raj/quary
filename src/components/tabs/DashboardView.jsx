import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShoppingCart, FileCheck2, Wallet, ArrowRight, ChevronRight } from 'lucide-react';
import KpiCard from '../KpiCard';
import SalesAreaChart from '../SalesAreaChart';

export default function DashboardView({
  stats,
  sales,
  purchases,
  passBatches,
  purchaseCategoryStats,
  setActiveTab,
  formatDate
}) {
  const loadCountText = sales.length === 1 ? '1 load dispatched' : `${sales.length} loads dispatched`;

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="space-y-6"
    >
      {/* 4 KPI Cards (Dashboard ONLY) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Quarry Sales */}
        <KpiCard
          title="Total Quarry Sales"
          value={`₹${stats.totalSalesAmount.toLocaleString('en-IN')}`}
          subValue={loadCountText}
          icon={TrendingUp}
          trend={{ text: '14.8% vs last wk', isPositive: true }}
          accentColor="emerald"
          sparklineData={[12, 19, 14, 25, 22, 31, 38]}
          onClick={() => setActiveTab('sales')}
        />

        {/* Card 2: Purchases & Rent */}
        <KpiCard
          title="Purchases & Rent"
          value={`₹${stats.totalPurchaseAmount.toLocaleString('en-IN')}`}
          subValue={`+₹${stats.totalPassCost.toLocaleString('en-IN')} pass fee`}
          icon={ShoppingCart}
          trend={{ text: '3.2% vs budget', isNegative: true }}
          accentColor="rose"
          sparklineData={[18, 12, 28, 22, 34, 18, 24]}
          onClick={() => setActiveTab('purchase')}
        />

        {/* Card 3: Govt Transit Passes */}
        <KpiCard
          title="Govt Transit Passes"
          value={`${stats.remainingPasses}`}
          subValue={`${stats.totalPassesUsed} of ${stats.totalPassesBought} used`}
          icon={FileCheck2}
          trend={{ text: 'Active stock', isPositive: true }}
          accentColor="amber"
          extraBadge={`${Math.round((stats.remainingPasses / (stats.totalPassesBought || 1)) * 100)}% left`}
          sparklineData={[50, 48, 45, 42, 38, 32, 69]}
          onClick={() => setActiveTab('pass')}
        />

        {/* Card 4: Net Balance */}
        <KpiCard
          title="Net Quarry Balance"
          value={`₹${stats.netProfit.toLocaleString('en-IN')}`}
          subValue="Revenue - Expenses"
          icon={Wallet}
          trend={{
            text: stats.netProfit >= 0 ? 'Healthy margin' : 'Deficit',
            isPositive: stats.netProfit >= 0,
            isNegative: stats.netProfit < 0
          }}
          accentColor={stats.netProfit >= 0 ? 'emerald' : 'rose'}
          sparklineData={[5, 12, 10, 18, 24, 28, 35]}
        />
      </div>

      {/* SaaS Area Chart: Sales vs Outflow */}
      <SalesAreaChart
        sales={sales}
        purchases={purchases}
        passBatches={passBatches}
      />

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Dispatches */}
        <div className="lg:col-span-2 rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Recent Dispatches & Lorry Deliveries
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest material loads dispatched under Naveen and quarry agents
              </p>
            </div>
            <button
              onClick={() => setActiveTab('sales')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer"
            >
              <span>View All Sales</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.05]">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Agent & Buyer</th>
                  <th className="pb-3 px-3">Material</th>
                  <th className="pb-3 px-3">Lorry No</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {sales.slice(0, 5).map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-3 text-slate-400 tabular-nums">
                      {formatDate(s.date)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-white">{s.agentName}</span>
                      <span className="text-slate-400"> → {s.subBuyerName}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{s.material}</td>
                    <td className="py-3 px-3 font-mono text-slate-300 font-medium">
                      {s.lorryNo}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400 tabular-nums">
                      ₹{Number(s.amount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Cost Distribution Breakdown */}
        <div className="rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Cost Distribution
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Oct 2026</span>
            </div>

            <div className="space-y-3.5">
              {purchaseCategoryStats.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{item.category}</span>
                    <span className="font-semibold text-white tabular-nums">
                      ₹{item.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rose-500 to-amber-500 h-full rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
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
    </motion.div>
  );
}
