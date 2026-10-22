import React, { useMemo } from 'react';
import {
  Landmark,
  ArrowDownToLine,
  ArrowUpRight,
  Truck,
  CheckCircle2,
  FileCheck2,
  Layers
} from 'lucide-react';
import { formatPassDate } from '../../utils/passHelpers';

export default function TreasuryLedger({
  treasuryLedger = [],
  sales = [],
  batches = [],
  treasuryStats = {
    totalReceived: 0,
    totalWithdrawn: 0,
    totalSpent: 0,
    balance: 0,
    govtSpent: 0
  }
}) {
  // Calculate running balance for each ledger entry chronologically
  const ledgerWithBalance = useMemo(() => {
    // Sort oldest first to calculate running balance
    const sortedOldest = [...treasuryLedger].sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (a.id || '').localeCompare(b.id || '');
    });

    let running = 0;
    const computed = sortedOldest.map(entry => {
      const count = Number(entry.passes || 0);
      if (entry.type === 'received_expired' || entry.type === 'received_manual') {
        running += count;
      } else if (entry.type === 'withdrawn') {
        running -= count;
      }
      return {
        ...entry,
        balanceAfter: Math.max(0, running)
      };
    });

    // Return newest first for display
    return computed.reverse();
  }, [treasuryLedger]);

  // Dispatches that spent passes from Treasury batches
  const treasurySpentDispatches = useMemo(() => {
    // Identify all batch IDs or batch numbers that are treasury-sourced
    const treasuryBatchSet = new Set(
      batches.filter(b => b.source === 'treasury').map(b => b.batchNo)
    );

    const list = [];
    sales.forEach(sale => {
      if (sale.passDeductions && Array.isArray(sale.passDeductions)) {
        sale.passDeductions.forEach(d => {
          if (d.source === 'treasury' || treasuryBatchSet.has(d.batchNo) || d.batchNo?.startsWith('TRS-')) {
            list.push({
              id: `${sale.id}-${d.batchNo}`,
              date: sale.date,
              lorryNo: sale.lorryNo,
              agentName: sale.agentName,
              subBuyerName: sale.subBuyerName,
              batchNo: d.batchNo,
              passes: d.count
            });
          }
        });
      } else if (sale.passesUsed > 0) {
        // Fallback for sales without explicit deductions if batchNo matches
        if (sale.batchNo && (treasuryBatchSet.has(sale.batchNo) || sale.batchNo.startsWith('TRS-'))) {
          list.push({
            id: sale.id,
            date: sale.date,
            lorryNo: sale.lorryNo,
            agentName: sale.agentName,
            subBuyerName: sale.subBuyerName,
            batchNo: sale.batchNo,
            passes: sale.passesUsed
          });
        }
      }
    });

    return list;
  }, [sales, batches]);

  // Split Bar metrics: Govt Passes Used vs Treasury Passes Used
  const { govtSpent, totalSpent } = treasuryStats;
  const totalCombinedUsed = (govtSpent || 0) + (totalSpent || 0);
  const govtPercent = totalCombinedUsed > 0 ? Math.round((govtSpent / totalCombinedUsed) * 100) : 100;
  const treasuryPercent = totalCombinedUsed > 0 ? Math.round((totalSpent / totalCombinedUsed) * 100) : 0;

  const getTypeBadge = (type) => {
    switch (type) {
      case 'received_expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Received (Expired)</span>
          </span>
        );
      case 'received_manual':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>Received (Manual)</span>
          </span>
        );
      case 'withdrawn':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Withdrawn</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Small Split Bar: Govt Passes Used vs Treasury Passes Used */}
      <div className="rounded-xl p-4 sm:p-5 bg-[#111827] border border-white/[0.07] card-shine space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white text-[11px] uppercase tracking-wider">
              Govt Passes Used vs Treasury Passes Used
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-amber-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
              Govt Passes: <strong className="font-mono tabular-nums">{govtSpent}</strong> ({govtPercent}%)
            </span>
            <span className="text-blue-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" />
              Treasury Passes: <strong className="font-mono tabular-nums">{totalSpent}</strong> ({treasuryPercent}%)
            </span>
          </div>
        </div>

        {/* Dual Progress Bar */}
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
          <div
            className="bg-amber-400 h-full transition-all duration-300"
            style={{ width: `${govtPercent}%` }}
            title={`Govt Passes Used: ${govtSpent} (${govtPercent}%)`}
          />
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${treasuryPercent}%` }}
            title={`Treasury Passes Used: ${totalSpent} (${treasuryPercent}%)`}
          />
        </div>
      </div>

      {/* 2. Treasury Ledger Table (Newest First) */}
      <div className="rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Landmark className="w-4 h-4 text-blue-400" />
              <span>Sam Blue Metal Treasury Ledger</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Append-only audit ledger of all pass credits and withdrawals at the Govt Treasury Office
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {ledgerWithBalance.length} {ledgerWithBalance.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.05]">
                <th className="pb-3 px-3">Date</th>
                <th className="pb-3 px-3">Type</th>
                <th className="pb-3 px-3">Batch / Ref</th>
                <th className="pb-3 px-3">Passes</th>
                <th className="pb-3 px-3">Balance After</th>
                <th className="pb-3 px-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {ledgerWithBalance.map((item) => {
                const isCredit = item.type === 'received_expired' || item.type === 'received_manual';
                return (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-3 text-slate-300 tabular-nums whitespace-nowrap">
                      <div className="font-semibold text-white">{formatPassDate(item.date)}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.id}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getTypeBadge(item.type)}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className="font-bold text-white block">{item.batchNo || '—'}</span>
                      {item.batchId && (
                        <span className="text-[10px] text-slate-500 block">{item.batchId}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 tabular-nums font-mono font-bold whitespace-nowrap">
                      <span className={isCredit ? 'text-blue-400' : 'text-amber-400'}>
                        {isCredit ? `+${item.passes}` : `-${item.passes}`}
                      </span>
                    </td>
                    <td className="py-3 px-3 tabular-nums font-mono font-bold text-white whitespace-nowrap">
                      {item.balanceAfter} Passes
                    </td>
                    <td className="py-3 px-3 text-slate-400 max-w-xs text-[11px] leading-relaxed">
                      {item.note || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {ledgerWithBalance.length === 0 && (
            <div className="py-10 text-center text-xs text-slate-500">
              No transactions recorded in the Treasury ledger yet.
            </div>
          )}
        </div>
      </div>

      {/* 3. Table: Treasury Passes Spent by Lorries */}
      <div className="rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Treasury Passes Spent by Lorries</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Lorry dispatches that consumed passes withdrawn from Sam Blue Metal Treasury batches
            </p>
          </div>
          <span className="text-xs text-emerald-400 font-semibold tabular-nums">
            Total Spent: {totalSpent} {totalSpent === 1 ? 'Pass' : 'Passes'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.05]">
                <th className="pb-3 px-3">Date</th>
                <th className="pb-3 px-3">Lorry No</th>
                <th className="pb-3 px-3">Agent & Buyer</th>
                <th className="pb-3 px-3">Batch (TRS-xxx)</th>
                <th className="pb-3 px-3 text-right">Passes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {treasurySpentDispatches.map((s, idx) => (
                <tr key={s.id || idx} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-3 text-slate-300 tabular-nums whitespace-nowrap">
                    {formatPassDate(s.date)}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-amber-300 whitespace-nowrap">
                    {s.lorryNo}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-white">{s.agentName}</span>
                    <span className="text-slate-400"> → {s.subBuyerName}</span>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-blue-300">
                    {s.batchNo}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold text-emerald-400">
                    -{s.passes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {treasurySpentDispatches.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              <Truck className="w-6 h-6 mx-auto mb-2 text-slate-600" />
              <p className="text-slate-400 font-medium">No Treasury passes spent yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                FIFO uses Govt batches first. Treasury passes are preserved until all Govt batches are empty.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
