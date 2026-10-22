import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck2,
  Plus,
  ShieldCheck,
  Truck,
  AlertTriangle,
  Clock,
  MoreVertical,
  Edit2,
  Eye,
  Settings,
  Landmark,
  ArrowDownToLine,
  Layers,
  ArrowRight,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import KpiCard from '../KpiCard';
import BatchStatusBadge from '../passes/BatchStatusBadge';
import ExpiryBanner from '../passes/ExpiryBanner';
import TreasuryCard from '../passes/TreasuryCard';
import TreasuryLedger from '../passes/TreasuryLedger';
import WithdrawModal from '../passes/WithdrawModal';
import PassSettingsModal from '../passes/PassSettingsModal';
import EditDueDateModal from '../passes/EditDueDateModal';
import ViewUsageModal from '../passes/ViewUsageModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import {
  getBatchStatus,
  getActivePassCount,
  getTreasuryBalance,
  getTreasuryStats,
  getNextExpiry,
  formatPassDate,
  addDaysToDate,
  getDaysDiff
} from '../../utils/passHelpers';

export default function PassesView({
  stats,
  passBatches = [],
  setPassBatches,
  treasuryLedger = [],
  setTreasuryLedger,
  sales = [],
  newPassBatch,
  setNewPassBatch,
  handleAddPassBatch,
  handleWithdrawFromTreasury,
  handleReturnToTreasuryManual,
  formatDate,
  showToast,
  passSettings = { defaultValidityDays: 30, warningDays: 7, lowStockLimit: 10 },
  onSavePassSettings
}) {
  const today = new Date().toISOString().split('T')[0];

  // View Sub-tabs: 'active' | 'ledger' | 'treasury'
  const [subView, setSubView] = useState('active');

  // Modals & Menu States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [viewingUsageBatch, setViewingUsageBatch] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [confirmEarlyReturn, setConfirmEarlyReturn] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  // Treasury Stats & Balances
  const treasuryBalance = useMemo(() => getTreasuryBalance(treasuryLedger), [treasuryLedger]);
  const treasuryStats = useMemo(
    () => getTreasuryStats(treasuryLedger, passBatches),
    [treasuryLedger, passBatches]
  );

  // Active Remaining: Valid govt passes + Treasury-withdrawn passes not yet used
  const activeRemaining = useMemo(() => getActivePassCount(passBatches, today), [passBatches, today]);

  // Total Bought from Govt (all govt batches ever)
  const totalBoughtFromGovt = useMemo(() => {
    return passBatches
      .filter(b => b.source !== 'treasury')
      .reduce((sum, b) => sum + Number(b.totalPasses !== undefined ? b.totalPasses : b.passesBought || 0), 0);
  }, [passBatches]);

  // Used by Lorries (govt + treasury)
  const totalUsedByLorries = useMemo(() => {
    return passBatches.reduce((sum, b) => sum + Number(b.usedPasses || 0), 0);
  }, [passBatches]);

  // Next expiry info
  const nextExpiry = useMemo(() => getNextExpiry(passBatches, today), [passBatches, today]);

  // Expiring soon batches within warning threshold
  const expiringBatches = useMemo(() => {
    return passBatches
      .filter(b => b.source !== 'treasury')
      .map(b => ({ ...b, statusInfo: getBatchStatus(b, today, passSettings.warningDays) }))
      .filter(b => b.statusInfo.status === 'Expiring Soon');
  }, [passBatches, today, passSettings.warningDays]);

  // Active Batches for the quick card view
  const activeBatchesList = useMemo(() => {
    return passBatches
      .map(b => ({ ...b, statusInfo: getBatchStatus(b, today, passSettings.warningDays) }))
      .filter(b => b.statusInfo.status === 'Active' || b.statusInfo.status === 'Expiring Soon');
  }, [passBatches, today, passSettings.warningDays]);

  // Stock utilization percentage based on active remaining passes
  const percentLeft = Math.round(
    (activeRemaining / (totalBoughtFromGovt + treasuryStats.totalWithdrawn || 1)) * 100
  );

  // Form field calculations: Issue Date, Validity, Valid Till
  const issueDate = newPassBatch?.issueDate || today;
  const validityDays = newPassBatch?.validityDays !== undefined ? newPassBatch.validityDays : passSettings.defaultValidityDays || 30;
  const calculatedValidTill = newPassBatch?.validTill || newPassBatch?.dueDate || addDaysToDate(issueDate, validityDays);

  const handleIssueDateChange = (val) => {
    const nextTill = addDaysToDate(val, validityDays);
    setNewPassBatch({
      ...newPassBatch,
      issueDate: val,
      validTill: nextTill,
      dueDate: nextTill
    });
  };

  const handleValidityChange = (val) => {
    const days = Number(val) || 0;
    const nextTill = addDaysToDate(issueDate, days);
    setNewPassBatch({
      ...newPassBatch,
      validityDays: days,
      validTill: nextTill,
      dueDate: nextTill
    });
  };

  const handleValidTillChange = (val) => {
    const days = getDaysDiff(val, issueDate);
    setNewPassBatch({
      ...newPassBatch,
      validTill: val,
      dueDate: val,
      validityDays: Math.max(1, days)
    });
  };

  // Update Batch Due Date
  const handleUpdateBatchDueDate = (batchId, updatedFields) => {
    if (setPassBatches) {
      setPassBatches(prev =>
        prev.map(b =>
          b.id === batchId
            ? {
                ...b,
                ...updatedFields,
                validTill: updatedFields.dueDate || updatedFields.validTill,
                dueDate: updatedFields.dueDate || updatedFields.validTill
              }
            : b
        )
      );
    }
    if (showToast) showToast(`Batch validity updated to ${formatPassDate(updatedFields.dueDate || updatedFields.validTill)}`);
  };

  // Withdraw from Treasury execution
  const executeWithdraw = (passesCount, note) => {
    if (handleWithdrawFromTreasury) {
      handleWithdrawFromTreasury(passesCount, note);
    }
  };

  // Early Return to Treasury execution
  const executeEarlyReturn = (batch) => {
    if (handleReturnToTreasuryManual) {
      handleReturnToTreasuryManual(batch.id, 'Manual early return to Sam Blue Metal Treasury');
    }
  };

  return (
    <motion.div
      key="pass"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="space-y-6"
    >
      {/* 1. Alerts: Expiry Notice & Low Stock Warning */}
      <ExpiryBanner
        expiringBatches={expiringBatches}
        activeRemaining={activeRemaining}
        lowStockLimit={passSettings?.lowStockLimit || 10}
        treasuryBalance={treasuryBalance}
        onOpenBatchForm={() => {
          setSubView('active');
          const formEl = document.getElementById('pass-batch-form');
          formEl?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenWithdraw={() => setIsWithdrawOpen(true)}
      />

      {/* 2. KPI Cards Row (Pass Tracker Tab) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Bought from Govt */}
        <KpiCard
          title="Total Bought from Govt"
          value={`${totalBoughtFromGovt} Passes`}
          subValue={`${passBatches.filter(b => b.source !== 'treasury').length} govt batches acquired`}
          icon={ShieldCheck}
          trend={{ text: 'Govt permits', isPositive: true }}
          accentColor="slate"
          sparklineData={[50, 50, 50, 80, 80, 80, 80]}
        />

        {/* Card 2: Used by Lorries (Govt + Treasury) */}
        <KpiCard
          title="Used by Lorries"
          value={`${totalUsedByLorries} Passes`}
          subValue={`${treasuryStats.govtSpent} govt + ${treasuryStats.totalSpent} treasury`}
          icon={Truck}
          trend={{ text: 'FIFO deducted', isPositive: true }}
          accentColor="emerald"
          sparklineData={[1, 3, 4, 6, 8, 9, 11]}
        />

        {/* Card 3: Active Remaining */}
        <KpiCard
          title="Active Remaining"
          value={`${activeRemaining} Passes`}
          subValue="Valid govt + withdrawn treasury"
          icon={FileCheck2}
          trend={{
            text: activeRemaining >= (passSettings?.lowStockLimit || 10) ? `${percentLeft}% in stock` : 'Low stock warning',
            isPositive: activeRemaining >= (passSettings?.lowStockLimit || 10),
            isNegative: activeRemaining < (passSettings?.lowStockLimit || 10)
          }}
          accentColor={activeRemaining >= (passSettings?.lowStockLimit || 10) ? 'amber' : 'rose'}
          extraBadge={`${percentLeft}% left`}
          sparklineData={[50, 48, 45, 42, 38, 32, 69]}
        />

        {/* Card 4: In Treasury (Balance available to withdraw) */}
        <KpiCard
          title="In Treasury"
          value={`${treasuryBalance} Passes`}
          subValue="Held at Govt Treasury Office"
          icon={Landmark}
          trend={{ text: 'No expiry on withdrawal', isPositive: true }}
          accentColor="blue"
          extraBadge="₹0 Fee"
          sparklineData={[0, 0, 20, 20, 20, 20, 20]}
          onClick={() => setSubView('treasury')}
        />
      </div>

      {/* One line below KPI Cards: "Next expiry: TN-GEO-2026-881 in 5 days (20 passes)" */}
      <div className="p-3.5 rounded-xl bg-[#111827] border border-white/[0.07] flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          {nextExpiry ? (
            <span className="text-slate-200">
              Next expiry:{' '}
              <strong className="text-amber-300 font-mono font-bold">{nextExpiry.batchNo}</strong> in{' '}
              <strong className="text-amber-300 font-mono font-bold">
                {nextExpiry.daysLeft <= 0 ? 'today' : `${nextExpiry.daysLeft} days`}
              </strong>{' '}
              ({nextExpiry.unusedPasses} passes)
            </span>
          ) : (
            <span className="text-slate-400">
              All active Govt passes in stock are within safe validity limits.
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-slate-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Pass Rules & Thresholds</span>
          </button>
        </div>
      </div>

      {/* 3. Sub-View Navigation Switcher (Active Batches | Department Ledger | Sam Blue Metal Treasury) */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-1 overflow-x-auto">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Tab 1: Active Batches */}
          <button
            type="button"
            onClick={() => setSubView('active')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              subView === 'active'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Active Batches</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-slate-900 border border-white/[0.08]">
              {activeBatchesList.length}
            </span>
          </button>

          {/* Tab 2: Department Batches Ledger */}
          <button
            type="button"
            onClick={() => setSubView('ledger')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              subView === 'ledger'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Department Batches Ledger</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-slate-900 border border-white/[0.08]">
              {passBatches.length}
            </span>
          </button>

          {/* Tab 3: Sam Blue Metal Treasury */}
          <button
            type="button"
            onClick={() => setSubView('treasury')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              subView === 'treasury'
                ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Sam Blue Metal Treasury</span>
            <span className="text-[10px] px-2 py-0.2 rounded-full font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
              {treasuryBalance} Passes
            </span>
          </button>
        </div>

        {/* Quick Action: Withdraw from Treasury */}
        {treasuryBalance > 0 && subView !== 'treasury' && (
          <button
            onClick={() => setIsWithdrawOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm cursor-pointer"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Withdraw ({treasuryBalance})</span>
          </button>
        )}
      </div>

      {/* 4. Tab Content Rendering */}
      <AnimatePresence mode="wait">
        {/* VIEW 1: ACTIVE BATCHES & PROCURE FORM */}
        {subView === 'active' && (
          <motion.div
            key="subview-active"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Stock Progress Bar */}
            <div className="p-5 rounded-xl bg-[#111827] border border-white/[0.07] card-shine space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                    Transit Passes Stock & Utilization
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-amber-400 tabular-nums">
                    {totalUsedByLorries} used of {totalBoughtFromGovt + treasuryStats.totalWithdrawn} total ({activeRemaining} active remaining)
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-amber-500 to-amber-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, percentLeft))}%` }}
                />
              </div>
            </div>

            {/* Split: Procure Form + Active Batches Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Procure Govt Pass Batch Form */}
              <div id="pass-batch-form" className="rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine h-fit">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-amber-400" />
                    <span>Procure Govt Pass Batch</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="text-slate-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title="Pass Expiry Rules & Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddPassBatch} className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">
                      Pass Batch / Book No <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TN-GEO-2026-990"
                      value={newPassBatch.batchNo}
                      onChange={(e) => setNewPassBatch({ ...newPassBatch, batchNo: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400 uppercase"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-medium block mb-1">
                        Passes Bought <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 50"
                        value={newPassBatch.passesBought}
                        onChange={(e) => setNewPassBatch({ ...newPassBatch, passesBought: e.target.value })}
                        className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white tabular-nums placeholder-slate-600 focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-medium block mb-1">
                        Govt Fee / Pass (₹) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        value={newPassBatch.costPerPass}
                        onChange={(e) => setNewPassBatch({ ...newPassBatch, costPerPass: e.target.value })}
                        className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white tabular-nums focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Issue Date & Validity Days */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-medium block mb-1">
                        Issue Date <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="date"
                        value={issueDate}
                        onChange={(e) => handleIssueDateChange(e.target.value)}
                        className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-medium block mb-1">
                        Validity (Days) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={validityDays}
                        onChange={(e) => handleValidityChange(e.target.value)}
                        className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white tabular-nums focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Valid Till (auto = issue date + validity, editable) */}
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">
                      Valid Till <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={calculatedValidTill}
                      onChange={(e) => handleValidTillChange(e.target.value)}
                      className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                      required
                    />
                    {/* Helper text: "Unused passes will return to Sam Blue Metal Treasury on 31 Oct 2026" */}
                    <p className="text-[11px] text-amber-300/90 mt-1.5 flex items-center gap-1 font-medium leading-relaxed">
                      <Landmark className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                      <span>Unused passes will return to Sam Blue Metal Treasury on {formatPassDate(calculatedValidTill)}</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/80 border border-white/[0.05] flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total Batch Cost:</span>
                    <span className="font-bold text-amber-400 tabular-nums">
                      ₹{((Number(newPassBatch.passesBought) || 0) * (Number(newPassBatch.costPerPass) || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Procure Pass Batch</span>
                  </button>
                </form>
              </div>

              {/* Right: Active Batches List with Thin Usage Bars */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Active & Usable Pass Batches</span>
                        <span className="text-[11px] px-2 py-0.2 rounded-full font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          FIFO Queued
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Batches currently eligible for lorry dispatch deduction
                      </p>
                    </div>
                    <button
                      onClick={() => setSubView('ledger')}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
                    >
                      <span>View All Ledger</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {activeBatchesList.map(b => {
                      const bought = Number(b.totalPasses !== undefined ? b.totalPasses : b.passesBought || 0);
                      const used = Number(b.usedPasses || 0);
                      const unused = b.statusInfo.unused;
                      const usagePercent = bought > 0 ? Math.round((used / bought) * 100) : 0;
                      const isTreasury = b.source === 'treasury';

                      return (
                        <div
                          key={b.id}
                          className="p-4 rounded-xl bg-slate-900/80 border border-white/[0.06] hover:border-white/[0.12] transition space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              {isTreasury ? (
                                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
                                  <Landmark className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                                  <FileCheck2 className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-white text-sm">{b.batchNo}</span>
                                  <BatchStatusBadge statusInfo={b.statusInfo} showTreasuryTag />
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  {isTreasury ? 'Withdrawn from Treasury • No expiry' : `Valid till ${formatPassDate(b.validTill || b.dueDate)}`}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-mono font-bold text-emerald-400 text-sm block">
                                {unused} Passes Remaining
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {used} of {bought} used ({usagePercent}%)
                              </span>
                            </div>
                          </div>

                          {/* Thin usage bar (used / bought) */}
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isTreasury ? 'bg-blue-500' : 'bg-amber-400'
                              }`}
                              style={{ width: `${Math.min(100, usagePercent)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {activeBatchesList.length === 0 && (
                      <div className="py-12 text-center text-xs text-slate-500">
                        No active pass batches available. Procure a new batch or withdraw from Treasury.
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Dispatches Pass Deductions */}
                <div className="rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine">
                  <h3 className="text-sm font-bold text-white mb-3">
                    Recent Pass Deductions by Lorries
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sales.filter(s => s.passesUsed > 0).slice(0, 6).map(s => {
                      const passText = s.passesUsed === 1 ? '-1 Pass' : `-${s.passesUsed} Passes`;
                      return (
                        <div
                          key={s.id}
                          className="p-3 rounded-lg bg-slate-900/90 border border-white/[0.06] flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-white block">{s.lorryNo}</span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {s.agentName} → {s.subBuyerName} ({s.material})
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            {passText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: DEPARTMENT BATCHES LEDGER */}
        {subView === 'ledger' && (
          <motion.div
            key="subview-ledger"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-amber-400" />
                  <span>Department Batches Ledger</span>
                  <span className="text-[11px] px-2 py-0.2 rounded-full font-semibold bg-slate-800 text-slate-400 border border-white/[0.06]">
                    FIFO Auto-Deduction
                  </span>
                </h3>
                <span className="text-xs text-slate-400">
                  Comprehensive register of Govt and Treasury batches with validity, fees and live status
                </span>
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Pass Rules</span>
              </button>
            </div>

            {/* Table with columns: Date | Batch No | Bought | Used | Remaining | Valid Till | Status | Fee */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.05]">
                    <th className="pb-3 px-3">Date</th>
                    <th className="pb-3 px-3">Batch No</th>
                    <th className="pb-3 px-3">Bought</th>
                    <th className="pb-3 px-3">Used</th>
                    <th className="pb-3 px-3">Remaining</th>
                    <th className="pb-3 px-3">Valid Till</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Fee</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {passBatches.map(b => {
                    const statusInfo = getBatchStatus(b, today, passSettings.warningDays);
                    const bought = Number(b.totalPasses !== undefined ? b.totalPasses : b.passesBought || 0);
                    const used = Number(b.usedPasses || 0);
                    const unused = statusInfo.unused;
                    const isMenuOpen = activeMenuId === b.id;
                    const isTreasury = b.source === 'treasury';
                    const usagePercent = bought > 0 ? Math.round((used / bought) * 100) : 0;
                    const feeText = isTreasury ? '₹0' : `₹${b.feePerPass || b.costPerPass || 350}`;

                    return (
                      <tr key={b.id} className="hover:bg-slate-800/30 transition">
                        {/* 1. Date */}
                        <td className="py-3 px-3 text-slate-300 tabular-nums whitespace-nowrap">
                          <div className="font-semibold text-white">{formatPassDate(b.issueDate || b.date)}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{b.id}</div>
                        </td>

                        {/* 2. Batch No with Treasury tag if applicable */}
                        <td className="py-3 px-3 font-mono whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{b.batchNo}</span>
                            {isTreasury && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                Treasury
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {isTreasury ? 'Govt Treasury Office' : 'Dept of Geology & Mining'}
                          </div>
                        </td>

                        {/* 3. Bought */}
                        <td className="py-3 px-3 tabular-nums font-semibold text-white whitespace-nowrap">
                          +{bought}
                        </td>

                        {/* 4. Used with thin usage bar */}
                        <td className="py-3 px-3 tabular-nums text-slate-300 whitespace-nowrap">
                          <span>{used}</span>
                          {/* Thin usage bar in each row (used / bought) */}
                          <div className="w-16 bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isTreasury ? 'bg-blue-400' : 'bg-amber-400'}`}
                              style={{ width: `${Math.min(100, usagePercent)}%` }}
                            />
                          </div>
                        </td>

                        {/* 5. Remaining */}
                        <td className="py-3 px-3 tabular-nums font-bold whitespace-nowrap">
                          <span
                            className={
                              unused > 0
                                ? statusInfo.status === 'Expiring Soon'
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                                : 'text-slate-500'
                            }
                          >
                            {unused} Passes
                          </span>
                        </td>

                        {/* 6. Valid Till */}
                        <td className="py-3 px-3 tabular-nums whitespace-nowrap">
                          {isTreasury ? (
                            <span className="text-blue-300 font-medium">No expiry</span>
                          ) : (
                            <div>
                              <span className="font-semibold text-slate-200">
                                {formatPassDate(b.validTill || b.dueDate)}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {b.validityDays ? `${b.validityDays}d validity` : ''}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 7. Status Badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <BatchStatusBadge statusInfo={statusInfo} />
                        </td>

                        {/* 8. Fee */}
                        <td className="py-3 px-3 tabular-nums font-semibold text-slate-300 whitespace-nowrap">
                          {feeText}
                        </td>

                        {/* 9. Actions (⋮ Menu) */}
                        <td className="py-3 px-3 text-right relative whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(isMenuOpen ? null : b.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                            title="Batch Options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <div
                              ref={menuRef}
                              className="absolute right-3 top-full mt-1 w-52 bg-[#0E131F] border border-white/[0.12] rounded-xl shadow-2xl py-1.5 z-30 card-shine text-xs text-left"
                            >
                              {!isTreasury && (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setEditingBatch(b);
                                  }}
                                  className="w-full px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800/70 flex items-center gap-2 transition cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Edit Valid Till Date</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setViewingUsageBatch(b);
                                }}
                                className="w-full px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800/70 flex items-center gap-2 transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-400" />
                                <span>View Passes Used</span>
                              </button>

                              {/* "Return to Treasury now" early return option */}
                              {!isTreasury && unused > 0 && statusInfo.status !== 'Returned to Treasury' && (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setConfirmEarlyReturn(b);
                                  }}
                                  className="w-full px-3 py-2 text-left text-blue-300 hover:text-white hover:bg-slate-800/70 flex items-center gap-2 transition cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                                  <span>Return to Treasury now</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: SAM BLUE METAL TREASURY */}
        {subView === 'treasury' && (
          <motion.div
            key="subview-treasury"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Treasury Header KPI Card with 4 numbers + Withdraw button */}
            <TreasuryCard
              treasuryStats={treasuryStats}
              onOpenWithdraw={() => setIsWithdrawOpen(true)}
            />

            {/* Treasury Ledger table (newest first) + Spend Tracking + Split Bar */}
            <TreasuryLedger
              treasuryLedger={treasuryLedger}
              sales={sales}
              batches={passBatches}
              treasuryStats={treasuryStats}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals & Dialogs */}
      {/* 1. Withdraw Modal */}
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        treasuryBalance={treasuryBalance}
        onWithdraw={executeWithdraw}
      />

      {/* 2. Pass Settings Modal */}
      <PassSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={passSettings}
        onSaveSettings={onSavePassSettings}
      />

      {/* 3. Edit Due Date Modal */}
      <EditDueDateModal
        isOpen={Boolean(editingBatch)}
        onClose={() => setEditingBatch(null)}
        batch={editingBatch}
        onSave={handleUpdateBatchDueDate}
      />

      {/* 4. View Usage Modal */}
      <ViewUsageModal
        isOpen={Boolean(viewingUsageBatch)}
        onClose={() => setViewingUsageBatch(null)}
        batch={viewingUsageBatch}
        sales={sales}
        formatDate={formatDate}
      />

      {/* 5. Early Return to Treasury Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmEarlyReturn)}
        title={`Return passes from ${confirmEarlyReturn?.batchNo} to Treasury?`}
        message={`Are you sure you want to return ${
          confirmEarlyReturn
            ? Math.max(
                0,
                (confirmEarlyReturn.totalPasses !== undefined
                  ? confirmEarlyReturn.totalPasses
                  : confirmEarlyReturn.passesBought || 0) -
                  (confirmEarlyReturn.usedPasses || 0) -
                  (confirmEarlyReturn.returnedToTreasury || 0)
              )
            : 0
        } unused passes to Sam Blue Metal Treasury? They will be credited to the Treasury account and can be withdrawn later with no expiry.`}
        confirmText="Return to Treasury"
        confirmVariant="primary"
        onConfirm={() => {
          if (confirmEarlyReturn) {
            executeEarlyReturn(confirmEarlyReturn);
            setConfirmEarlyReturn(null);
          }
        }}
        onClose={() => setConfirmEarlyReturn(null)}
      />
    </motion.div>
  );
}
