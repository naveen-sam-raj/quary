import React from 'react';
import { AlertTriangle, Clock, ArrowRight, ShieldAlert, X } from 'lucide-react';
import { formatPassDate } from '../../utils/passHelpers';

export default function ExpiryBanner({ expiringBatches = [], onOpenBatchForm }) {
  if (!expiringBatches || expiringBatches.length === 0) return null;

  const first = expiringBatches[0];
  const totalAtRiskPasses = expiringBatches.reduce((sum, b) => sum + (b.statusInfo?.unused || 0), 0);
  const totalAtRiskValue = expiringBatches.reduce(
    (sum, b) => sum + (b.statusInfo?.unused || 0) * Number(b.costPerPass || 0),
    0
  );

  return (
    <div className="p-4 rounded-xl bg-amber-500/[0.12] border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/5 card-shine">
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0">
          <AlertTriangle className="w-4 h-4 animate-bounce" />
        </div>
        <div className="min-w-0 text-xs">
          <div className="font-bold text-white text-sm flex items-center gap-2">
            <span>Pass Expiry Alert</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold border border-amber-500/30">
              {first.statusInfo?.label}
            </span>
          </div>
          <p className="text-amber-200/90 mt-0.5 leading-relaxed">
            ⚠ <strong className="text-white font-mono">{first.statusInfo?.unused} passes</strong> from batch{' '}
            <strong className="text-white font-mono">{first.batchNo}</strong> expire on{' '}
            <strong className="text-white">{formatPassDate(first.dueDate)}</strong>. Use them in lorry dispatches or lose{' '}
            <strong className="text-white tabular-nums">₹{totalAtRiskValue.toLocaleString('en-IN')}</strong> in Govt fees.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {onOpenBatchForm && (
          <button
            onClick={onOpenBatchForm}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <span>Procure New Batch</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
