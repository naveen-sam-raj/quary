import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function SalesAreaChart({ sales = [], purchases = [], passBatches = [], dailySeries = [] }) {
  const [metricFilter, setMetricFilter] = useState('both'); // 'both' | 'sales' | 'expenses'

  const formatChartDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const chartData = useMemo(() => {
    if (Array.isArray(dailySeries) && dailySeries.length > 0) {
      return dailySeries.map((item) => ({
        date: formatChartDate(item.date),
        fullDate: item.date,
        sales: Number(item.revenue || 0),
        expenses: Number(item.expense || 0),
        net: Number(item.revenue || 0) - Number(item.expense || 0)
      }));
    }

    // Fallback if dailySeries not passed
    const timelineDates = ['10-14', '10-15', '10-16', '10-17', '10-18', '10-19', '10-20'];
    return timelineDates.map((dateKey) => {
      const daySales = sales
        .filter((s) => s.date && s.date.endsWith(dateKey))
        .reduce((sum, s) => sum + Number(s.amount || 0), 0);

      const dayPurchases = purchases
        .filter((p) => p.date && p.date.endsWith(dateKey))
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      return {
        date: `Oct ${dateKey.split('-')[1]}`,
        sales: daySales,
        expenses: dayPurchases,
        net: daySales - dayPurchases
      };
    });
  }, [dailySeries, sales, purchases]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0E131F] border border-white/[0.1] rounded-lg p-3 shadow-xl text-xs space-y-1.5">
          <div className="font-semibold text-slate-300 border-b border-white/[0.08] pb-1">
            {label}, 2026
          </div>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-400 capitalize">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name === 'sales' ? 'Quarry Sales' : 'Outflow / Rent'}:
              </span>
              <span className="font-bold text-white tabular-nums">
                ₹{Number(entry.value).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine">
      {/* Header and Toggle Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            Revenue & Outflow Analytics
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Daily quarry dispatches vs JCB, Diesel & Food expenditure
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-white/[0.06] text-xs">
          <button
            onClick={() => setMetricFilter('both')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              metricFilter === 'both'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Trends
          </button>
          <button
            onClick={() => setMetricFilter('sales')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              metricFilter === 'sales'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sales Only
          </button>
          <button
            onClick={() => setMetricFilter('expenses')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              metricFilter === 'expenses'
                ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Expenses Only
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />

            <XAxis
              dataKey="date"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={val => `₹${(val / 1000).toFixed(0)}k`}
            />

            <Tooltip content={<CustomTooltip />} />

            {(metricFilter === 'both' || metricFilter === 'sales') && (
              <Area
                type="monotone"
                dataKey="sales"
                name="sales"
                stroke="#F59E0B"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#salesGradient)"
              />
            )}

            {(metricFilter === 'both' || metricFilter === 'expenses') && (
              <Area
                type="monotone"
                dataKey="expenses"
                name="expenses"
                stroke="#F43F5E"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#expensesGradient)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Mini Legend Below Chart */}
      <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-end gap-5 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>Quarry Sales (Inflow)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span>Purchases, JCB & Food (Outflow)</span>
        </div>
      </div>
    </div>
  );
}
