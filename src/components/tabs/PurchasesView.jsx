import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Wrench, Utensils, Fuel, Plus } from 'lucide-react';
import KpiCard from '../KpiCard';

export default function PurchasesView({
  purchases,
  purchaseCategoryStats,
  newPurchase,
  setNewPurchase,
  handleAddPurchase,
  formatDate
}) {
  const totalPurchaseAmount = purchases.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const jcbTotal = purchases
    .filter(p => p.category.includes('JCB') || p.category.includes('Excavator'))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const foodTotal = purchases
    .filter(p => p.category.includes('Food'))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const dieselBlastingTotal = purchases
    .filter(p => p.category.includes('Diesel') || p.category.includes('Explosives') || p.category.includes('Blasting'))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const entryText = purchases.length === 1 ? '1 expense record' : `${purchases.length} expense records`;

  return (
    <motion.div
      key="purchase"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="space-y-6"
    >
      {/* 1. Purchase-Only Stat Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Quarry Outflow"
          value={`₹${totalPurchaseAmount.toLocaleString('en-IN')}`}
          subValue={entryText}
          icon={ShoppingCart}
          trend={{ text: '3.2% vs budget', isNegative: true }}
          accentColor="rose"
          sparklineData={[18, 12, 28, 22, 34, 18, 24]}
        />

        <KpiCard
          title="JCB & Excavator Rent"
          value={`₹${jcbTotal.toLocaleString('en-IN')}`}
          subValue="Pit work & heavy equipment"
          icon={Wrench}
          trend={{ text: 'Machinery active', isPositive: true }}
          accentColor="amber"
          sparklineData={[10, 18, 14, 22, 28, 34, 40]}
        />

        <KpiCard
          title="Workers Food & Mess"
          value={`₹${foodTotal.toLocaleString('en-IN')}`}
          subValue="Driver mess & worker tea"
          icon={Utensils}
          trend={{ text: 'Stable weekly cost', isPositive: true }}
          accentColor="slate"
          sparklineData={[8, 8.4, 8.2, 8.4, 8.4, 8.5, 8.4]}
        />

        <KpiCard
          title="Diesel & Blasting"
          value={`₹${dieselBlastingTotal.toLocaleString('en-IN')}`}
          subValue="Crusher fuel & explosives"
          icon={Fuel}
          trend={{ text: 'Fuel cost steady', isPositive: true }}
          accentColor="slate"
          sparklineData={[20, 25, 30, 28, 35, 42, 59]}
        />
      </div>

      {/* 2. Category Distribution Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {purchaseCategoryStats.map((item, idx) => {
          const colors = [
            'border-amber-500/30 text-amber-400',
            'border-blue-500/30 text-blue-400',
            'border-purple-500/30 text-purple-400',
            'border-rose-500/30 text-rose-400',
            'border-emerald-500/30 text-emerald-400'
          ];
          const colorClass = colors[idx % colors.length];

          return (
            <div key={idx} className="p-3.5 rounded-xl bg-[#111827] border border-white/[0.07] card-shine">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block truncate">
                {item.category}
              </span>
              <div className="mt-2 text-base font-bold text-white tabular-nums">
                ₹{item.total.toLocaleString('en-IN')}
              </div>
              <span className={`text-[10px] font-medium mt-1 inline-block ${colorClass}`}>
                {item.percentage}% of total
              </span>
            </div>
          );
        })}
      </div>

      {/* 3. Main Split: Purchase Entry Form + Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Record Expense Form */}
        <div className="rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 mb-4">
            <ShoppingCart className="w-4 h-4 text-rose-400" />
            <span>Record Quarry Expense</span>
          </h3>

          <form onSubmit={handleAddPurchase} className="space-y-3.5 text-xs">
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
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Vendor / Contractor Name</label>
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
              className="w-full mt-2 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/15 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          </form>
        </div>

        {/* Right Column: Ledger Table */}
        <div className="lg:col-span-2 rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Quarry Expense Ledger</h3>
              <p className="text-xs text-slate-400">
                {entryText}
              </p>
            </div>
            <span className="text-xs font-bold text-rose-400 tabular-nums">
              Total: ₹{totalPurchaseAmount.toLocaleString('en-IN')}
            </span>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {purchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
