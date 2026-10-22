import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Menu,
  Search,
  Bell,
  Download,
  Calendar,
  FileCheck2,
  Wallet,
  Sun,
  Moon,
  ChevronDown,
  AlertTriangle,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { getBatchStatus, formatPassDate } from '../utils/passHelpers';

export default function Header({
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab,
  stats,
  passBatches = [],
  passSettings = { defaultValidityDays: 30, warningDays: 7, lowStockLimit: 10 },
  isDarkTheme,
  setIsDarkTheme,
  onOpenSearch,
  onExport
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute expiry alerts & low stock alerts
  const alerts = useMemo(() => {
    const list = [];
    const warningDays = passSettings?.warningDays || 7;
    const lowLimit = passSettings?.lowStockLimit || 10;

    let activeCount = 0;

    passBatches.forEach(b => {
      const statusInfo = getBatchStatus(b, undefined, warningDays);
      if (statusInfo.status === 'Active' || statusInfo.status === 'Expiring Soon') {
        activeCount += statusInfo.unused;
      }

      if (statusInfo.status === 'Expiring Soon' && statusInfo.unused > 0 && b.source !== 'treasury') {
        list.push({
          id: b.id,
          type: 'warning',
          title: `${statusInfo.unused} passes from ${b.batchNo} expire soon`,
          message: `${statusInfo.unused} passes from ${b.batchNo} expire on ${formatPassDate(b.validTill || b.dueDate)} and will return to Treasury.`,
          daysLeft: statusInfo.daysLeft,
          batchNo: b.batchNo
        });
      }
    });

    // Low stock warning when total available passes are below configured threshold
    if (activeCount < lowLimit) {
      list.push({
        id: 'low-stock-alert',
        type: 'danger',
        title: `Low Pass Stock (${activeCount} passes remaining)`,
        message: `Total active transit passes are below ${lowLimit}. Withdraw from Treasury or procure a new Govt batch.`,
        batchNo: 'Stock Warning'
      });
    }

    return list;
  }, [passBatches, passSettings]);

  const hasAlerts = alerts.length > 0;
  const getTabLabel = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Overview Dashboard';
      case 'sales':
        return '1. Sales & Agent Tree';
      case 'purchase':
        return '2. Purchases & Rent Outflow';
      case 'pass':
        return '3. Govt Transit Pass Tracker';
      case 'reports':
        return '4. Date-Wise Reports & Statements';
      default:
        return 'Overview Dashboard';
    }
  };

  return (
    <header className="border-b border-white/[0.07] bg-[#0E131F]/90 backdrop-blur sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-4">
      {/* Left: Hamburger & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-amber-400 border border-white/[0.08] transition flex items-center justify-center cursor-pointer shadow-sm shrink-0"
          title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="min-w-0 flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium hidden sm:inline">Quarry ERP</span>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <h2 className="text-sm font-semibold text-white tracking-tight truncate">
            {getTabLabel()}
          </h2>
        </div>
      </div>

      {/* Middle: Global Search Input (Ctrl + K) */}
      <div className="hidden md:flex items-center mx-2 shrink-0">
        <div
          onClick={onOpenSearch}
          className="w-56 lg:w-72 flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/90 border border-white/[0.08] hover:border-white/[0.16] cursor-pointer text-xs text-slate-400 transition"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate whitespace-nowrap text-xs">Search lorries, agents...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono border border-slate-700 shrink-0 ml-2">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Right: Actions, Stat Pills & Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Quick Date Range Badge - Click to open reports */}
        <button
          onClick={onExport}
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/[0.06] hover:border-amber-500/30 text-xs text-slate-300 hover:text-amber-300 transition cursor-pointer"
          title="Open Date Range Reports"
        >
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>Oct 2026 (Reports)</span>
        </button>

        {/* Govt Passes Live Pill (Dashboard Only) */}
        {activeTab === 'dashboard' && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-white/[0.07] text-xs">
            <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Passes:</span>
            <span className="font-semibold text-amber-400 tabular-nums">
              {stats.remainingPasses}
            </span>
          </div>
        )}

        {/* Net Balance Pill (Dashboard Only) */}
        {activeTab === 'dashboard' && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-white/[0.07] text-xs">
            <Wallet className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Balance:</span>
            <span
              className={`font-semibold tabular-nums ${
                stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              ₹{stats.netProfit.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Reports / Export Button */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.08] hover:border-amber-500/40 text-xs font-semibold transition cursor-pointer shadow-sm"
          title="Generate Date Range Reports & Statements"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>Reports</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setIsDarkTheme(!isDarkTheme)}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/[0.08] transition cursor-pointer"
          title={isDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/[0.08] transition cursor-pointer"
            title="Notifications & Alerts"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {hasAlerts ? (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" />
            ) : (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-slate-600 ring-2 ring-slate-900" />
            )}
          </button>

          {/* Notifications Popover Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#111827] border border-white/[0.1] shadow-2xl p-4 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">Notifications</span>
                  {hasAlerts && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {alerts.length} action required
                    </span>
                  )}
                </div>
                {hasAlerts && (
                  <button
                    onClick={() => {
                      if (setActiveTab) setActiveTab('pass');
                      setShowNotifications(false);
                    }}
                    className="text-amber-400 hover:text-amber-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Pass Tracker</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {hasAlerts ? (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {alerts.map((al, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (setActiveTab) setActiveTab('pass');
                        setShowNotifications(false);
                      }}
                      className={`p-3 rounded-lg border transition cursor-pointer ${
                        al.type === 'danger'
                          ? 'bg-rose-500/10 border-rose-500/25 hover:bg-rose-500/15'
                          : 'bg-amber-500/10 border-amber-500/25 hover:bg-amber-500/15'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {al.type === 'danger' ? (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold ${al.type === 'danger' ? 'text-rose-300' : 'text-amber-300'}`}>
                            {al.title}
                          </div>
                          <div className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                            {al.message}
                          </div>
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                            <span>Click to manage in Pass Tracker →</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400">
                  <div className="w-9 h-9 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-slate-300 text-xs">All clear!</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    No pass batches are expiring or require immediate attention.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-bold text-[11px] flex items-center justify-center shrink-0 cursor-pointer shadow-sm">
          NS
        </div>
      </div>
    </header>
  );
}
