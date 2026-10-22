import React from 'react';
import { Landmark, ArrowDownToLine, ArrowUpRight, Truck, Wallet, ShieldCheck } from 'lucide-react';

export default function TreasuryCard({
  treasuryStats = {
    totalReceived: 0,
    totalWithdrawn: 0,
    totalSpent: 0,
    balance: 0,
    govtSpent: 0
  },
  onOpenWithdraw
}) {
  const { totalReceived, totalWithdrawn, totalSpent, balance } = treasuryStats;

  return (
    <div className="rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine space-y-5">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Sam Blue Metal Treasury
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                Govt Treasury Office Account
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Passes returned on expiry are safely escrowed here and can be withdrawn anytime with no expiry
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenWithdraw}
          disabled={balance === 0}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-md ${
            balance > 0
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 cursor-pointer'
              : 'bg-slate-800 text-slate-500 border border-white/[0.06] cursor-not-allowed opacity-60'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>Withdraw Passes ({balance} available)</span>
        </button>
      </div>

      {/* 4 KPI Numbers Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Received in Treasury */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/[0.06] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Received</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">
            {totalReceived}
          </div>
          <div className="text-[10px] text-slate-400">
            Auto & manual returns
          </div>
        </div>

        {/* Metric 2: Withdrawn from Treasury */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/[0.06] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Withdrawn</span>
            <ArrowDownToLine className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono tabular-nums">
            {totalWithdrawn}
          </div>
          <div className="text-[10px] text-slate-400">
            ₹0 withdrawal fee
          </div>
        </div>

        {/* Metric 3: Spent (used by lorries from withdrawn passes) */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/[0.06] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Spent by Lorries</span>
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {totalSpent}
          </div>
          <div className="text-[10px] text-slate-400">
            From withdrawn batches
          </div>
        </div>

        {/* Metric 4: Treasury Balance (available to withdraw) */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-500/30 space-y-1">
          <div className="flex items-center justify-between text-blue-300">
            <span className="text-[11px] font-bold uppercase tracking-wider">Treasury Balance</span>
            <Wallet className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-400 font-mono tabular-nums">
            {balance}
          </div>
          <div className="text-[10px] text-blue-300/80 font-medium">
            Available to withdraw
          </div>
        </div>
      </div>
    </div>
  );
}
