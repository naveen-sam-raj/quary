import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FileCheck2,
  Plus,
  ShieldCheck,
  Truck,
  AlertTriangle,
  XCircle,
  Clock,
  MoreVertical,
  Edit2,
  ShieldOff,
  Eye,
  Settings,
  Calendar,
  Building
} from 'lucide-react';
import KpiCard from '../KpiCard';
import BatchStatusBadge from '../passes/BatchStatusBadge';
import ExpiryBanner from '../passes/ExpiryBanner';
import ExpiredPassesTable from '../passes/ExpiredPassesTable';
import PassSettingsModal from '../passes/PassSettingsModal';
import EditDueDateModal from '../passes/EditDueDateModal';
import SurrenderModal from '../passes/SurrenderModal';
import ViewUsageModal from '../passes/ViewUsageModal';
import {
  getBatchStatus,
  getValidPassCount,
  getExpiredLossSummary,
  getNextExpiry,
  formatPassDate,
  addDaysToDate,
  getDaysDiff
} from '../../utils/passHelpers';

export default function PassesView({
  stats,
  passBatches = [],
  setPassBatches,
  sales = [],
  newPassBatch,
  setNewPassBatch,
  handleAddPassBatch,
  formatDate,
  showToast,
  passSettings = { defaultValidityDays: 30, warningDays: 7 },
  onSavePassSettings
}) {
  const today = new Date().toISOString().split('T')[0];

  // Modals & Menu States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [surrenderingBatch, setSurrenderingBatch] = useState(null);
  const [viewingUsageBatch, setViewingUsageBatch] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
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

  // Compute Valid Passes, Expired Losses, and Next Expiry
  const validRemaining = useMemo(() => getValidPassCount(passBatches, today), [passBatches, today]);
  const lossSummary = useMemo(() => getExpiredLossSummary(passBatches, today), [passBatches, today]);
  const nextExpiry = useMemo(() => getNextExpiry(passBatches, today), [passBatches, today]);

  // Find all batches that are expiring soon (within warning threshold)
  const expiringBatches = useMemo(() => {
    return passBatches
      .map(b => ({ ...b, statusInfo: getBatchStatus(b, today, passSettings.warningDays) }))
      .filter(b => b.statusInfo.status === 'Expiring Soon');
  }, [passBatches, today, passSettings.warningDays]);

  // Calculate stock utilization percentage based on valid passes
  const percentLeft = Math.round(
    (validRemaining / (stats.totalPassesBought || 1)) * 100
  );

  // Form field calculations
  const issueDate = newPassBatch.issueDate || today;
  const validityDays = newPassBatch.validityDays !== undefined ? newPassBatch.validityDays : passSettings.defaultValidityDays;
  const calculatedDueDate = newPassBatch.dueDate || addDaysToDate(issueDate, validityDays);

  const handleIssueDateChange = (val) => {
    const nextDue = addDaysToDate(val, validityDays);
    setNewPassBatch({ ...newPassBatch, issueDate: val, dueDate: nextDue });
  };

  const handleValidityChange = (val) => {
    const days = Number(val) || 0;
    const nextDue = addDaysToDate(issueDate, days);
    setNewPassBatch({ ...newPassBatch, validityDays: days, dueDate: nextDue });
  };

  const handleDueDateChange = (val) => {
    const days = getDaysDiff(val, issueDate);
    setNewPassBatch({ ...newPassBatch, dueDate: val, validityDays: Math.max(1, days) });
  };

  // Handlers for Batch Actions
  const handleUpdateBatchDueDate = (batchId, updatedFields) => {
    if (setPassBatches) {
      setPassBatches(prev =>
        prev.map(b => (b.id === batchId ? { ...b, ...updatedFields } : b))
      );
    }
    if (showToast) showToast(`Batch due date updated to ${formatPassDate(updatedFields.dueDate)}`);
  };

  const handleSurrenderBatch = (batchId, surrenderData) => {
    if (setPassBatches) {
      setPassBatches(prev =>
        prev.map(b => (b.id === batchId ? { ...b, ...surrenderData } : b))
      );
    }
    if (showToast) showToast(`Passes surrendered to Department successfully`);
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
      {/* 1. Alert Banner for Expiring Batches */}
      <ExpiryBanner
        expiringBatches={expiringBatches}
        onOpenBatchForm={() => {
          const formEl = document.getElementById('pass-batch-form');
          formEl?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 2. Pass-Only Stat Row (4 KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Passes Remaining in Stock (Only Valid Non-Expired Passes) */}
        <KpiCard
          title="Passes Remaining in Stock"
          value={`${validRemaining} Passes`}
          subValue="Valid stock for dispatches"
          icon={FileCheck2}
          trend={{ text: `${percentLeft}% valid stock`, isPositive: validRemaining > 10 }}
          accentColor="amber"
          extraBadge={`${percentLeft}% left`}
          sparklineData={[50, 48, 45, 42, 38, 32, 69]}
        />

        {/* Card 2: Total Passes Purchased */}
        <KpiCard
          title="Total Passes Purchased"
          value={`${stats.totalPassesBought} Passes`}
          subValue={`${passBatches.length} batches procured`}
          icon={ShieldCheck}
          trend={{ text: 'Dept permits', isPositive: true }}
          accentColor="slate"
          sparklineData={[50, 50, 50, 80, 80, 80, 80]}
        />

        {/* Card 3: Passes Used by Lorries */}
        <KpiCard
          title="Passes Used by Lorries"
          value={`${stats.totalPassesUsed} Passes`}
          subValue="FIFO deducted on dispatch"
          icon={Truck}
          trend={{ text: 'Auto-deducted', isPositive: true }}
          accentColor="emerald"
          sparklineData={[1, 3, 4, 6, 8, 9, 11]}
        />

        {/* Card 4: Expired / Lost Passes (Red) */}
        <KpiCard
          title="Expired / Lost Passes"
          value={`${lossSummary.expiredPasses} Passes`}
          subValue={
            lossSummary.expiredValue > 0
              ? `₹${lossSummary.expiredValue.toLocaleString('en-IN')} value wasted`
              : 'Zero expired passes'
          }
          icon={XCircle}
          trend={{
            text: lossSummary.expiredPasses > 0 ? 'Wasted pass fees' : 'Healthy stock',
            isNegative: lossSummary.expiredPasses > 0,
            isPositive: lossSummary.expiredPasses === 0
          }}
          accentColor={lossSummary.expiredPasses > 0 ? 'rose' : 'slate'}
          sparklineData={[0, 0, 0, 5, 5, 8, 8]}
        />
      </div>

      {/* 3. Pass Stock Progress Bar & Next Expiry Indicator */}
      <div className="p-5 rounded-xl bg-[#111827] border border-white/[0.07] card-shine space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              Transit Passes Stock & Utilization
            </span>
          </div>

          <div className="flex items-center gap-3">
            {nextExpiry && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium">
                Next expiry: <strong className="font-mono">{nextExpiry.batchNo}</strong> in{' '}
                <strong className="font-mono">{nextExpiry.daysLeft} days</strong> ({nextExpiry.unusedPasses} passes)
              </span>
            )}

            <span className="font-semibold text-amber-400 tabular-nums">
              {stats.totalPassesUsed} used of {stats.totalPassesBought} total ({validRemaining} valid remaining)
            </span>
          </div>
        </div>

        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 via-amber-500 to-amber-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${percentLeft}%` }}
          />
        </div>
      </div>

      {/* 4. Add Batch & Batch Ledger Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Procure Govt Pass Batch Form */}
        <div id="pass-batch-form" className="rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              <span>Procure Govt Pass Batch</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
              title="Pass Expiry Rules & Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddPassBatch} className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-400 font-medium block mb-1">Pass Batch / Book No</label>
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
                <label className="text-slate-400 font-medium block mb-1">Passes Bought</label>
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
                <label className="text-slate-400 font-medium block mb-1">Govt Fee / Pass (₹)</label>
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
                <label className="text-slate-400 font-medium block mb-1">Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => handleIssueDateChange(e.target.value)}
                  className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 font-medium block mb-1">Validity (Days)</label>
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

            {/* Due / Expiry Date */}
            <div>
              <label className="text-slate-400 font-medium block mb-1">Due / Expiry Date</label>
              <input
                type="date"
                value={calculatedDueDate}
                onChange={(e) => handleDueDateChange(e.target.value)}
                className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                required
              />
              <p className="text-[11px] text-amber-300/90 mt-1.5 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Passes in this batch expire on {formatPassDate(calculatedDueDate)}</span>
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
              <span>Add Pass Batch</span>
            </button>
          </form>
        </div>

        {/* Right Column: Pass Batches Ledger & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Batches Table with Status, Due Date, Unused Passes and Actions */}
          <div className="rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06] mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Department Batches Ledger</span>
                  <span className="text-[11px] px-2 py-0.2 rounded-full font-semibold bg-slate-800 text-slate-400 border border-white/[0.06]">
                    FIFO Auto-Deduction
                  </span>
                </h3>
                <span className="text-xs text-slate-400">Issued by Dept of Geology & Mining</span>
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Pass Rules</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.05]">
                    <th className="pb-3 px-3">Batch No & ID</th>
                    <th className="pb-3 px-3">Due Date</th>
                    <th className="pb-3 px-3">Stock & Used</th>
                    <th className="pb-3 px-3">Unused Passes</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {passBatches.map(b => {
                    const statusInfo = getBatchStatus(b, today, passSettings.warningDays);
                    const bought = Number(b.passesBought || 0);
                    const used = Number(b.usedPasses || 0);
                    const surrendered = Number(b.surrenderedPasses || 0);
                    const unused = Math.max(0, bought - used - surrendered);
                    const isMenuOpen = activeMenuId === b.id;

                    return (
                      <tr key={b.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-3 text-slate-300">
                          <div className="font-mono font-bold text-white">{b.batchNo}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{b.id} • Issued {formatPassDate(b.issueDate || b.date)}</div>
                        </td>
                        <td className="py-3 px-3 tabular-nums">
                          <div className="font-semibold text-slate-200">{formatPassDate(b.dueDate)}</div>
                          <div className="text-[10px] text-slate-400">{b.validityDays || 30} days validity</div>
                        </td>
                        <td className="py-3 px-3 text-slate-300 tabular-nums">
                          <span className="font-semibold text-white">+{bought}</span> bought
                          <span className="text-slate-400 block text-[10px]">{used} dispatched</span>
                        </td>
                        <td className="py-3 px-3 tabular-nums">
                          <span className={`font-bold ${unused > 0 ? (statusInfo.status === 'Expiring Soon' ? 'text-amber-400' : 'text-emerald-400') : 'text-slate-500'}`}>
                            {unused} Passes
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <BatchStatusBadge statusInfo={statusInfo} />
                        </td>
                        <td className="py-3 px-3 text-right relative">
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
                              className="absolute right-3 top-full mt-1 w-44 bg-[#0E131F] border border-white/[0.12] rounded-xl shadow-2xl py-1.5 z-30 card-shine text-xs text-left"
                            >
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setEditingBatch(b);
                                }}
                                className="w-full px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800/70 flex items-center gap-2 transition"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                                <span>Edit Due Date</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setViewingUsageBatch(b);
                                }}
                                className="w-full px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800/70 flex items-center gap-2 transition"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-400" />
                                <span>View Passes Used</span>
                              </button>

                              {unused > 0 && statusInfo.status !== 'Expired' && (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setSurrenderingBatch(b);
                                  }}
                                  className="w-full px-3 py-2 text-left text-blue-300 hover:text-white hover:bg-slate-800/70 flex items-center gap-2 transition"
                                >
                                  <ShieldOff className="w-3.5 h-3.5 text-blue-400" />
                                  <span>Surrender to Dept</span>
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
          </div>

          {/* Auto-synced Pass Deduction History */}
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

      {/* 5. Expired & Surrendered Passes Ledger Section */}
      <ExpiredPassesTable batches={passBatches} today={today} />

      {/* Modals */}
      <PassSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={passSettings}
        onSaveSettings={onSavePassSettings}
      />

      <EditDueDateModal
        isOpen={Boolean(editingBatch)}
        onClose={() => setEditingBatch(null)}
        batch={editingBatch}
        onSave={handleUpdateBatchDueDate}
      />

      <SurrenderModal
        isOpen={Boolean(surrenderingBatch)}
        onClose={() => setSurrenderingBatch(null)}
        batch={surrenderingBatch}
        onSurrender={handleSurrenderBatch}
        today={today}
      />

      <ViewUsageModal
        isOpen={Boolean(viewingUsageBatch)}
        onClose={() => setViewingUsageBatch(null)}
        batch={viewingUsageBatch}
        sales={sales}
        formatDate={formatDate}
      />
    </motion.div>
  );
}
