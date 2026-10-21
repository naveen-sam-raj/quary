import React from 'react';
import { XCircle, ShieldOff, AlertCircle } from 'lucide-react';
import { formatPassDate, getBatchStatus } from '../../utils/passHelpers';
import BatchStatusBadge from './BatchStatusBadge';

export default function ExpiredPassesTable({ batches = [], today }) {
  // Find all batches that have expired or surrendered passes
  const inactiveBatches = batches.filter(b => {
    const statusInfo = getBatchStatus(b, today);
    return statusInfo.status === 'Expired' || b.surrenderedPasses > 0;
  });

  const totalLostCount = inactiveBatches.reduce((sum, b) => {
    const statusInfo = getBatchStatus(b, today);
    return sum + (statusInfo.status === 'Expired' ? statusInfo.unused : 0);
  }, 0);

  const totalLostValue = inactiveBatches.reduce((sum, b) => {
    const statusInfo = getBatchStatus(b, today);
    return sum + (statusInfo.status === 'Expired' ? statusInfo.unused * Number(b.costPerPass || 0) : 0);
  }, 0);

  return (
    <div className="rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Expired & Surrendered Passes Ledger</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit trail of passes that passed due dates or were returned to the Mining Department
          </p>
        </div>

        {totalLostValue > 0 && (
          <div className="text-xs px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 font-semibold tabular-nums">
            Total Financial Loss: ₹{totalLostValue.toLocaleString('en-IN')} ({totalLostCount} passes)
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.05]">
              <th className="pb-3 px-3">Batch Number</th>
              <th className="pb-3 px-3">Due / Surrender Date</th>
              <th className="pb-3 px-3">Passes Affected</th>
              <th className="pb-3 px-3">Financial Impact</th>
              <th className="pb-3 px-3">Status</th>
              <th className="pb-3 px-3">Notes & Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {inactiveBatches.map(b => {
              const statusInfo = getBatchStatus(b, today);
              const isExpired = statusInfo.status === 'Expired';
              const affectedCount = isExpired ? statusInfo.unused : b.surrenderedPasses;
              const lostValue = isExpired ? affectedCount * Number(b.costPerPass || 0) : 0;

              return (
                <tr key={b.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-white block">{b.batchNo}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{b.id}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 tabular-nums">
                    {formatPassDate(isExpired ? b.dueDate : b.surrenderDate || b.dueDate)}
                  </td>
                  <td className="py-3 px-3 tabular-nums font-bold">
                    <span className={isExpired ? 'text-rose-400' : 'text-blue-400'}>
                      {affectedCount} {affectedCount === 1 ? 'Pass' : 'Passes'}
                    </span>
                  </td>
                  <td className="py-3 px-3 tabular-nums">
                    {isExpired ? (
                      <span className="text-rose-400 font-bold">
                        -₹{lostValue.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">No loss (Surrendered)</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <BatchStatusBadge statusInfo={statusInfo} />
                  </td>
                  <td className="py-3 px-3 text-slate-400 max-w-xs truncate">
                    {b.surrenderNote || (isExpired ? 'Validity period elapsed without dispatch' : '—')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {inactiveBatches.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-500">
            <p className="text-emerald-400 font-medium">✓ Zero Pass Wastage</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              All transit passes are active or fully utilized. No expired or surrendered passes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
