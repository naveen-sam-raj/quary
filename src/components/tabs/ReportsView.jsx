import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Download,
  Printer,
  Copy,
  TrendingUp,
  ShoppingCart,
  FileCheck2,
  Wallet,
  Truck,
  Filter,
  FileSpreadsheet,
  Check,
  ChevronRight,
  Building2,
  RefreshCw
} from 'lucide-react';
import KpiCard from '../KpiCard';

export default function ReportsView({
  sales = [],
  purchases = [],
  passBatches = [],
  agents = [],
  showToast,
  formatDate
}) {
  // Date range state (defaulting to the active operational month)
  const [fromDate, setFromDate] = useState('2026-10-01');
  const [toDate, setToDate] = useState('2026-10-31');
  const [reportType, setReportType] = useState('ALL'); // 'ALL' | 'SALES' | 'PURCHASES' | 'PASSES'
  const [selectedAgent, setSelectedAgent] = useState('ALL');
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Quick date presets
  const applyPreset = (type) => {
    if (type === 'TODAY') {
      setFromDate('2026-10-18');
      setToDate('2026-10-18');
    } else if (type === '7DAYS') {
      setFromDate('2026-10-12');
      setToDate('2026-10-18');
    } else if (type === 'MONTH') {
      setFromDate('2026-10-01');
      setToDate('2026-10-31');
    } else if (type === 'ALL') {
      setFromDate('');
      setToDate('');
    }
    if (showToast) showToast(`Report range updated: ${type}`);
  };

  // Filtered records by Date Range & Agent
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchFrom = !fromDate || s.date >= fromDate;
      const matchTo = !toDate || s.date <= toDate;
      const matchAgent = selectedAgent === 'ALL' || s.agentName === selectedAgent;
      return matchFrom && matchTo && matchAgent;
    });
  }, [sales, fromDate, toDate, selectedAgent]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const matchFrom = !fromDate || p.date >= fromDate;
      const matchTo = !toDate || p.date <= toDate;
      return matchFrom && matchTo;
    });
  }, [purchases, fromDate, toDate]);

  const filteredPassBatches = useMemo(() => {
    return passBatches.filter(b => {
      const matchFrom = !fromDate || b.date >= fromDate;
      const matchTo = !toDate || b.date <= toDate;
      return matchFrom && matchTo;
    });
  }, [passBatches, fromDate, toDate]);

  // Aggregate metrics for selected date range
  const metrics = useMemo(() => {
    const totalSalesAmount = filteredSales.reduce((acc, s) => acc + Number(s.amount || 0), 0);
    const totalPurchaseAmount = filteredPurchases.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const totalPassCost = filteredPassBatches.reduce((acc, b) => acc + Number(b.totalCost || 0), 0);
    const totalExpenses = totalPurchaseAmount + totalPassCost;
    const netProfit = totalSalesAmount - totalExpenses;
    const totalLoads = filteredSales.length;
    const totalPassesUsed = filteredSales.reduce((acc, s) => acc + Number(s.passesUsed || 0), 0);
    const totalPassesBought = filteredPassBatches.reduce((acc, b) => acc + Number(b.passesBought || 0), 0);
    const totalUnitsSold = filteredSales.reduce((acc, s) => acc + Number(s.units || 0), 0);

    return {
      totalSalesAmount,
      totalPurchaseAmount,
      totalPassCost,
      totalExpenses,
      netProfit,
      totalLoads,
      totalPassesUsed,
      totalPassesBought,
      totalUnitsSold
    };
  }, [filteredSales, filteredPurchases, filteredPassBatches]);

  // Export to CSV / Excel
  const handleExportCSV = () => {
    let csvRows = [];

    if (reportType === 'ALL' || reportType === 'SALES') {
      csvRows.push(['--- SALES & LORRY DISPATCHES ---']);
      csvRows.push(['Date', 'Slip ID', 'Agent Name', 'Sub-Buyer', 'Material', 'Units', 'Lorry Number', 'Passes Used', 'Amount (INR)', 'Status']);
      filteredSales.forEach(s => {
        csvRows.push([
          s.date,
          s.id,
          s.agentName,
          s.subBuyerName,
          `"${s.material}"`,
          s.units,
          s.lorryNo,
          s.passesUsed,
          s.amount,
          s.status
        ]);
      });
      csvRows.push([]);
    }

    if (reportType === 'ALL' || reportType === 'PURCHASES') {
      csvRows.push(['--- PURCHASES & OPERATING EXPENSES ---']);
      csvRows.push(['Date', 'Voucher ID', 'Category', 'Vendor', 'Description', 'Amount (INR)', 'Payment Mode']);
      filteredPurchases.forEach(p => {
        csvRows.push([
          p.date,
          p.id,
          `"${p.category}"`,
          `"${p.vendor}"`,
          `"${p.description}"`,
          p.amount,
          p.paymentMode
        ]);
      });
      csvRows.push([]);
    }

    if (reportType === 'ALL' || reportType === 'PASSES') {
      csvRows.push(['--- GOVT TRANSIT PASS BATCHES ---']);
      csvRows.push(['Date', 'Batch ID', 'Batch Number', 'Passes Bought', 'Cost Per Pass (INR)', 'Total Cost (INR)', 'Authority']);
      filteredPassBatches.forEach(b => {
        csvRows.push([
          b.date,
          b.id,
          b.batchNo,
          b.passesBought,
          b.costPerPass,
          b.totalCost,
          `"${b.authority}"`
        ]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeFrom = fromDate || 'Start';
    const safeTo = toDate || 'Latest';
    link.setAttribute('download', `Blue_Metal_Quarry_Report_${safeFrom}_to_${safeTo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showToast) showToast('Report exported to CSV successfully');
  };

  // Copy Summary text to Clipboard
  const handleCopySummary = () => {
    const summaryText = `📊 BLUE METAL QUARRY STATEMENT
Period: ${fromDate || 'Beginning'} to ${toDate || 'Present'}
━━━━━━━━━━━━━━━━━━━━
💰 Total Sales Revenue: ₹${metrics.totalSalesAmount.toLocaleString('en-IN')} (${metrics.totalLoads} loads)
🛒 Purchases & Rent: ₹${metrics.totalPurchaseAmount.toLocaleString('en-IN')}
🎟️ Govt Pass Fee: ₹${metrics.totalPassCost.toLocaleString('en-IN')} (${metrics.totalPassesUsed} passes used)
📉 Total Quarry Outflow: ₹${metrics.totalExpenses.toLocaleString('en-IN')}
━━━━━━━━━━━━━━━━━━━━
📈 NET QUARRY BALANCE: ₹${metrics.netProfit.toLocaleString('en-IN')}
Generated by Blue Metal ERP on ${new Date().toLocaleDateString('en-IN')}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
      if (showToast) showToast('Statement summary copied to clipboard');
    }
  };

  // Print Statement (Trigger browser print with clean printable CSS)
  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      key="reports"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="space-y-6"
    >
      {/* 1. Header & Date Range Filter Card */}
      <div className="rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine no-print">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.06] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Quarry Statement & Report Generator</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Custom Period
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate date-filtered financial statements, lorry dispatches, expenses, and pass audits
              </p>
            </div>
          </div>

          {/* Action Buttons: Print, CSV, Copy */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Copy WhatsApp / SMS summary"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedSummary ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Download Excel / CSV file"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10"
              title="Print official letterhead statement"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Date Inputs & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* From Date */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>From Date</span>
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-slate-900 border border-white/[0.1] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>To Date</span>
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-slate-900 border border-white/[0.1] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Report Category Type */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>Report Type</span>
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-900 border border-white/[0.1] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">All Quarry P&L Summary</option>
              <option value="SALES">Sales & Lorry Dispatches</option>
              <option value="PURCHASES">Purchases & Operating Rent</option>
              <option value="PASSES">Govt Transit Pass Stock</option>
            </select>
          </div>

          {/* Agent Filter */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
              <span>Filter Agent</span>
            </label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full bg-slate-900 border border-white/[0.1] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">All Quarry Agents</option>
              {agents.map(a => (
                <option key={a.id} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Date Presets Row */}
        <div className="mt-4 pt-3 border-t border-white/[0.05] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="font-medium text-slate-400">Quick Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => applyPreset('TODAY')}
                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.06] transition"
              >
                Today
              </button>
              <button
                onClick={() => applyPreset('7DAYS')}
                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.06] transition"
              >
                Last 7 Days
              </button>
              <button
                onClick={() => applyPreset('MONTH')}
                className="px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold transition"
              >
                This Month (Oct 2026)
              </button>
              <button
                onClick={() => applyPreset('ALL')}
                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.06] transition"
              >
                All Records
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Showing records between <span className="font-semibold text-slate-200">{fromDate || 'Start'}</span> to <span className="font-semibold text-slate-200">{toDate || 'Present'}</span>
          </div>
        </div>
      </div>

      {/* 2. Real-time Calculated KPI Cards for Selected Date Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <KpiCard
          title="Period Sales Revenue"
          value={`₹${metrics.totalSalesAmount.toLocaleString('en-IN')}`}
          subValue={`${metrics.totalLoads} loads (${metrics.totalUnitsSold} Units)`}
          icon={TrendingUp}
          trend={{ text: `${filteredSales.length} dispatches`, isPositive: true }}
          accentColor="emerald"
        />

        <KpiCard
          title="Period Outflows & Rent"
          value={`₹${metrics.totalPurchaseAmount.toLocaleString('en-IN')}`}
          subValue={`+₹${metrics.totalPassCost.toLocaleString('en-IN')} pass fee`}
          icon={ShoppingCart}
          trend={{ text: `${filteredPurchases.length} vouchers`, isNegative: true }}
          accentColor="rose"
        />

        <KpiCard
          title="Govt Transit Passes Used"
          value={`${metrics.totalPassesUsed} Passes`}
          subValue={`${metrics.totalPassesBought} bought in period`}
          icon={FileCheck2}
          trend={{ text: 'Stock consumption', isPositive: true }}
          accentColor="amber"
        />

        <KpiCard
          title="Net Period Balance"
          value={`₹${metrics.netProfit.toLocaleString('en-IN')}`}
          subValue="Revenue - Total Outflow"
          icon={Wallet}
          trend={{
            text: metrics.netProfit >= 0 ? 'Net Surplus' : 'Net Deficit',
            isPositive: metrics.netProfit >= 0,
            isNegative: metrics.netProfit < 0
          }}
          accentColor={metrics.netProfit >= 0 ? 'emerald' : 'rose'}
        />
      </div>

      {/* 3. Official Statement Preview (Printable Letterhead Layout) */}
      <div className="rounded-xl p-6 bg-[#111827] border border-white/[0.07] card-shine space-y-6 printable-report">
        {/* Printable Letterhead Header */}
        <div className="border-b border-white/[0.1] pb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white uppercase">
                BLUE METAL QUARRY & CRUSHERS
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Government Licensed Mining & Aggregates Supplier • Enterprise Statement
            </p>
          </div>

          <div className="text-right text-xs space-y-1">
            <div className="font-semibold text-white">
              Statement Period: <span className="font-mono text-amber-300">{fromDate ? formatDate(fromDate) : 'Start'}</span> to <span className="font-mono text-amber-300">{toDate ? formatDate(toDate) : 'Present'}</span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Generated on: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
            {selectedAgent !== 'ALL' && (
              <div className="text-amber-400 font-semibold text-[11px]">
                Filtered for Agent: {selectedAgent}
              </div>
            )}
          </div>
        </div>

        {/* Executive Period Summary Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/80 border border-white/[0.05]">
          <div>
            <span className="text-[11px] text-slate-400 block">Total Sales</span>
            <span className="text-sm sm:text-base font-bold text-emerald-400 tabular-nums">
              ₹{metrics.totalSalesAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Operating Outflow</span>
            <span className="text-sm sm:text-base font-bold text-rose-400 tabular-nums">
              ₹{metrics.totalExpenses.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Net Margin</span>
            <span className={`text-sm sm:text-base font-bold tabular-nums ${metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ₹{metrics.netProfit.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Loads Dispatched</span>
            <span className="text-sm sm:text-base font-bold text-white tabular-nums">
              {metrics.totalLoads} Loads ({metrics.totalUnitsSold} Units)
            </span>
          </div>
        </div>

        {/* Section A: Sales Dispatches Table */}
        {(reportType === 'ALL' || reportType === 'SALES') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>1. Lorry Dispatches & Collections ({filteredSales.length})</span>
              </h4>
              <span className="text-xs font-bold text-emerald-400 tabular-nums">
                Subtotal: ₹{metrics.totalSalesAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.05]">
                    <th className="pb-2.5 px-3">Date & ID</th>
                    <th className="pb-2.5 px-3">Agent & Sub-Buyer</th>
                    <th className="pb-2.5 px-3">Material</th>
                    <th className="pb-2.5 px-3">Lorry No</th>
                    <th className="pb-2.5 px-3">Pass</th>
                    <th className="pb-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredSales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3 text-slate-300 tabular-nums">
                        <div className="font-semibold">{formatDate(s.date)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{s.id}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-white">{s.subBuyerName}</span>
                        <span className="text-slate-400 block text-[10px]">under {s.agentName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {s.material}
                        <span className="text-slate-400 block text-[10px]">{s.units} Units</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-amber-300">
                        {s.lorryNo}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          -{s.passesUsed}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400 tabular-nums">
                        ₹{Number(s.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                        No sales dispatched during the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section B: Operating Purchases & Rent Table */}
        {(reportType === 'ALL' || reportType === 'PURCHASES') && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-rose-400" />
                <span>2. Quarry Purchases, JCB & Diesel Outflows ({filteredPurchases.length})</span>
              </h4>
              <span className="text-xs font-bold text-rose-400 tabular-nums">
                Subtotal: ₹{metrics.totalPurchaseAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.05]">
                    <th className="pb-2.5 px-3">Date & ID</th>
                    <th className="pb-2.5 px-3">Category</th>
                    <th className="pb-2.5 px-3">Vendor</th>
                    <th className="pb-2.5 px-3">Description</th>
                    <th className="pb-2.5 px-3">Payment</th>
                    <th className="pb-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredPurchases.map(p => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3 text-slate-300 tabular-nums">
                        <div className="font-semibold">{formatDate(p.date)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.id}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-white">{p.vendor}</td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">{p.description}</td>
                      <td className="py-2.5 px-3 text-slate-400">{p.paymentMode}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-400 tabular-nums">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {filteredPurchases.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                        No purchase expenses recorded during the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section C: Govt Pass Batches in Range */}
        {(reportType === 'ALL' || reportType === 'PASSES') && filteredPassBatches.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-amber-400" />
                <span>3. Govt Transit Pass Batches Acquired ({filteredPassBatches.length})</span>
              </h4>
              <span className="text-xs font-bold text-amber-400 tabular-nums">
                Cost: ₹{metrics.totalPassCost.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.05]">
                    <th className="pb-2.5 px-3">Date</th>
                    <th className="pb-2.5 px-3">Batch Number</th>
                    <th className="pb-2.5 px-3">Passes Bought</th>
                    <th className="pb-2.5 px-3">Rate</th>
                    <th className="pb-2.5 px-3">Authority</th>
                    <th className="pb-2.5 px-3 text-right">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredPassBatches.map(b => (
                    <tr key={b.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3 text-slate-300 tabular-nums font-semibold">{formatDate(b.date)}</td>
                      <td className="py-2.5 px-3 font-mono text-amber-300 font-semibold">{b.batchNo}</td>
                      <td className="py-2.5 px-3 font-bold text-white tabular-nums">{b.passesBought} Passes</td>
                      <td className="py-2.5 px-3 text-slate-300 tabular-nums">₹{b.costPerPass}/pass</td>
                      <td className="py-2.5 px-3 text-slate-400">{b.authority}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-300 tabular-nums">
                        ₹{Number(b.totalCost).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Official Signoff Box for Printed Statement */}
        <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
          <div>
            <span>Verified & Prepared By: </span>
            <span className="text-white font-semibold">Naveen Sam (Quarry Manager)</span>
          </div>
          <div className="text-right">
            <span>Authorised Signature: </span>
            <span className="text-white font-semibold underline decoration-amber-500/50">Blue Metal Mining Office</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
