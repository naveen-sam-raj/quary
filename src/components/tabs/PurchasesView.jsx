import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Wrench, Utensils, Fuel, Plus, Edit2, Trash2, X, Check, FileSpreadsheet } from 'lucide-react';
import KpiCard from '../KpiCard';
import { useAuth } from '../../context/AuthContext';
import { downloadPurchasesExcel } from '../../utils/exportHelpers';

export default function PurchasesView({
  purchases = [],
  purchaseCategoryStats = [],
  newPurchase,
  setNewPurchase,
  handleAddPurchase,
  handleUpdatePurchase,
  handleDeletePurchase,
  formatDate,
  isLoading = false
}) {
  const { isViewer, isAdmin } = useAuth();
  const [editingId, setEditingId] = useState(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const totalPurchaseAmount = purchases.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const jcbTotal = purchases
    .filter(p => p.category === 'JCB' || p.category.includes('JCB'))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const machineryTotal = purchases
    .filter(p => p.category === 'Machinery' || p.category.includes('Hitachi') || p.category.includes('Crusher') || p.category.includes('Machinery'))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const foodTotal = purchases
    .filter(p => p.category === 'Food' || p.category.includes('Food') || p.category.includes('Mess'))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const dieselTotal = purchases
    .filter(p => p.category === 'Diesel' || p.category.includes('Diesel'))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const jcbPercent = totalPurchaseAmount > 0 ? ((jcbTotal / totalPurchaseAmount) * 100).toFixed(0) : 0;
  const machineryPercent = totalPurchaseAmount > 0 ? ((machineryTotal / totalPurchaseAmount) * 100).toFixed(0) : 0;
  const foodPercent = totalPurchaseAmount > 0 ? ((foodTotal / totalPurchaseAmount) * 100).toFixed(0) : 0;
  const dieselPercent = totalPurchaseAmount > 0 ? ((dieselTotal / totalPurchaseAmount) * 100).toFixed(0) : 0;

  const entryText = `${purchases.length} expense record${purchases.length === 1 ? '' : 's'}`;

  const handleEditClick = (p) => {
    setEditingId(p.id || p._id);
    setNewPurchase({
      date: p.date || new Date().toISOString().split('T')[0],
      category: p.category || 'JCB Rent',
      vendor: p.vendor || '',
      description: p.description || '',
      notes: p.notes || '',
      amount: p.amount || '',
      paymentMode: p.paymentMode || 'Cash'
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewPurchase({
      category: 'JCB Rent',
      vendor: '',
      description: '',
      notes: '',
      amount: '',
      paymentMode: 'Cash'
    });
  };

  const onSubmitForm = async (e) => {
    e.preventDefault();
    if (editingId && handleUpdatePurchase) {
      await handleUpdatePurchase(editingId, newPurchase);
      handleCancelEdit();
    } else {
      await handleAddPurchase(e);
    }
  };

  const onDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      if (handleDeletePurchase) {
        await handleDeletePurchase(id);
      }
      if (editingId === id) {
        handleCancelEdit();
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Purchases & Rent"
          value={`₹${totalPurchaseAmount.toLocaleString('en-IN')}`}
          subtitle={`${entryText} recorded`}
          icon={ShoppingCart}
          trend={{ text: `${purchases.length} total entries`, isPositive: true }}
          accentColor="rose"
        />
        <KpiCard
          title="JCB Rent Expense"
          value={`₹${jcbTotal.toLocaleString('en-IN')}`}
          subtitle={`${jcbPercent}% of total expenses`}
          icon={Wrench}
          accentColor="amber"
        />
        <KpiCard
          title="Machinery & Hitachi"
          value={`₹${machineryTotal.toLocaleString('en-IN')}`}
          subtitle={`${machineryPercent}% of total expenses`}
          icon={Wrench}
          accentColor="indigo"
        />
        <KpiCard
          title="Food Rent (Mess & Tea)"
          value={`₹${foodTotal.toLocaleString('en-IN')}`}
          subtitle={`${foodPercent}% of total expenses`}
          icon={Utensils}
          accentColor="emerald"
        />
      </div>

      {/* Expense Categories Breakdown Bar */}
      <div className="rounded-xl p-5 bg-[#111827] border border-white/[0.07] card-shine">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Quarry Expense Category Breakdown</h3>
            <p className="text-xs text-slate-400">
              Operational spend tracking across rent, diesel, machinery and staff food
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 w-fit">
            Spend Total: ₹{totalPurchaseAmount.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-white/[0.05]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">JCB Rent</span>
              <span className="font-bold text-amber-400">{jcbPercent}%</span>
            </div>
            <div className="text-base font-bold text-white tabular-nums">
              ₹{jcbTotal.toLocaleString('en-IN')}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-amber-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Number(jcbPercent))}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-white/[0.05]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Hitachi / Excavator</span>
              <span className="font-bold text-indigo-400">{machineryPercent}%</span>
            </div>
            <div className="text-base font-bold text-white tabular-nums">
              ₹{machineryTotal.toLocaleString('en-IN')}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-indigo-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Number(machineryPercent))}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-white/[0.05]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Diesel (Crusher/Tipper)</span>
              <span className="font-bold text-cyan-400">{dieselPercent}%</span>
            </div>
            <div className="text-base font-bold text-white tabular-nums">
              ₹{dieselTotal.toLocaleString('en-IN')}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-cyan-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Number(dieselPercent))}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-white/[0.05]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Food Rent (Mess & Tea)</span>
              <span className="font-bold text-emerald-400">{foodPercent}%</span>
            </div>
            <div className="text-base font-bold text-white tabular-nums">
              ₹{foodTotal.toLocaleString('en-IN')}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Number(foodPercent))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-column layout: Form (left) + Ledger (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Record Expense Form */}
        <div className="rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine h-fit">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                {editingId ? 'Edit Quarry Expense' : 'Record Quarry Expense'}
              </h3>
              <p className="text-xs text-slate-400">
                {editingId ? 'Update details of this expense' : 'Add JCB, Hitachi, Diesel or Mess entry'}
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={onSubmitForm} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 font-medium block mb-1">Expense Category</label>
              <select
                value={newPurchase.category}
                onChange={(e) => setNewPurchase({ ...newPurchase, category: e.target.value })}
                className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                <option>JCB Rent</option>
                <option>Hitachi / Excavator Rent</option>
                <option>Food Rent (Mess & Tea)</option>
                <option>Tipper & Machinery Diesel</option>
                <option>Explosives / Blasting</option>
                <option>Crusher Maintenance</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Vendor / Provider Name</label>
              <input
                type="text"
                placeholder="e.g. Velavan Earthmovers"
                value={newPurchase.vendor}
                onChange={(e) => setNewPurchase({ ...newPurchase, vendor: e.target.value })}
                className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Work Description / Details</label>
              <input
                type="text"
                placeholder="e.g. 2 Days JCB Pit Work"
                value={newPurchase.description}
                onChange={(e) => setNewPurchase({ ...newPurchase, description: e.target.value })}
                className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">
                Notes <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Bill #104, driver advance, site remarks"
                value={newPurchase.notes || ''}
                onChange={(e) => setNewPurchase({ ...newPurchase, notes: e.target.value })}
                className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 18500"
                  value={newPurchase.amount}
                  onChange={(e) => setNewPurchase({ ...newPurchase, amount: e.target.value })}
                  className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white font-bold tabular-nums placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 font-medium block mb-1">Payment Mode</label>
                <select
                  value={newPurchase.paymentMode}
                  onChange={(e) => setNewPurchase({ ...newPurchase, paymentMode: e.target.value })}
                  className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  <option>Cash</option>
                  <option>UPI / GPay</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isViewer}
              className={`w-full mt-2 py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 shadow-md ${
                isViewer
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/[0.05]'
                  : editingId
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/15 cursor-pointer'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/15 cursor-pointer'
              }`}
            >
              {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isViewer ? 'Read-Only Mode' : editingId ? 'Update Expense' : 'Record Expense'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Ledger Table */}
        <div className="lg:col-span-2 rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Quarry Expense Ledger</h3>
              <p className="text-xs text-slate-400">
                {isLoading ? 'Loading expenses from API...' : entryText}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  try {
                    setIsExportingExcel(true);
                    await downloadPurchasesExcel();
                  } catch {
                    // toast handled in helper
                  } finally {
                    setIsExportingExcel(false);
                  }
                }}
                disabled={isExportingExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                title="Export purchases to Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{isExportingExcel ? 'Exporting...' : 'Export Excel'}</span>
              </button>
              <span className="text-xs font-bold text-rose-400 tabular-nums">
                Total: ₹{totalPurchaseAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.05]">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Category</th>
                  <th className="pb-3 px-3">Vendor & Details</th>
                  <th className="pb-3 px-3">Payment</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                  {!isViewer && <th className="pb-3 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {isLoading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-3">
                        <div className="h-3.5 bg-slate-800 rounded w-20" />
                      </td>
                      <td className="py-3 px-3">
                        <div className="h-3.5 bg-slate-800 rounded w-16" />
                      </td>
                      <td className="py-3 px-3">
                        <div className="h-3.5 bg-slate-800 rounded w-28 mb-1" />
                        <div className="h-2.5 bg-slate-850 rounded w-36" />
                      </td>
                      <td className="py-3 px-3">
                        <div className="h-4 bg-slate-800 rounded w-14" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="h-4 bg-slate-800 rounded w-16 ml-auto" />
                      </td>
                      {!isViewer && (
                        <td className="py-3 px-3 text-right">
                          <div className="h-4 bg-slate-800 rounded w-10 ml-auto" />
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  purchases.map(p => (
                    <tr key={p.id || p._id} className="hover:bg-slate-800/30 transition group">
                      <td className="py-3 px-3 text-slate-400 tabular-nums">
                        {formatDate(p.date)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-200 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{p.vendor}</div>
                        <div className="text-[10px] text-slate-400">{p.description}</div>
                        {p.notes && (
                          <div className="text-[10px] text-amber-300/85 mt-0.5">
                            <span className="text-slate-400 font-semibold">Note:</span> {p.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-white/[0.05]">
                          {p.paymentMode}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-400 tabular-nums">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </td>
                      {!isViewer && (
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={() => handleEditClick(p)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition"
                              title="Edit Expense"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => onDeleteClick(p.id || p._id)}
                                className="p-1 rounded bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                                title="Delete Expense"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {!isLoading && purchases.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-500">
                No expense records recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
