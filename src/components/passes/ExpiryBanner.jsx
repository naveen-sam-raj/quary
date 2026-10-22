import React from 'react';
import { AlertTriangle, Clock, ArrowRight, Landmark, ShieldAlert, ArrowDownToLine } from 'lucide-react';
import { formatPassDate } from '../../utils/passHelpers';

export default function ExpiryBanner({
  expiringBatches = [],
  activeRemaining = 0,
  lowStockLimit = 10,
  treasuryBalance = 0,
  onOpenBatchForm,
  onOpenWithdraw
}) {
  const isLowStock = activeRemaining < Number(lowStockLimit || 10);
  const hasExpiring = expiringBatches && expiringBatches.length > 0;

  if (!hasExpiring && !isLowStock) return null;

  const firstExpiring = hasExpiring ? expiringBatches[0] : null;

  return (
    <div className="space-y-3">
      {/* 1. Expiring Soon Alert Banner */}
      {hasExpiring && firstExpiring && (
        <div className="p-4 rounded-xl bg-amber-500/[0.12] border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/5 card-shine">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0 text-xs">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <span>Pass Expiry Alert</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-semibold border border-amber-500/30">
                  {firstExpiring.statusInfo?.label}
                </span>
              </div>
              <p className="text-amber-200/90 mt-0.5 leading-relaxed">
                ⚠ <strong className="text-white font-mono">{firstExpiring.statusInfo?.unused} passes</strong> from{' '}
                <strong className="text-white font-mono">{firstExpiring.batchNo}</strong> expire on{' '}
                <strong className="text-white">
                  {formatPassDate(firstExpiring.validTill || firstExpiring.dueDate)}
                </strong>{' '}
                and will return to Treasury.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {onOpenWithdraw && treasuryBalance > 0 && (
              <button
                onClick={onOpenWithdraw}
                className="px-3 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>Treasury ({treasuryBalance})</span>
              </button>
            )}
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
      )}

      {/* 2. Low Stock Warning (when total available passes < lowStockLimit) */}
      {isLowStock && (
        <div className="p-3.5 rounded-xl bg-rose-500/[0.12] border border-rose-500/30 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md card-shine">
          <div className="flex items-center gap-2.5 min-w-0 text-xs">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-white">Low Stock Warning: </span>
              <span className="text-rose-200">
                Only <strong className="text-white font-mono">{activeRemaining} passes</strong> available in active stock
                (below threshold of {lowStockLimit}).
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center text-xs">
            {treasuryBalance > 0 && onOpenWithdraw && (
              <button
                onClick={onOpenWithdraw}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>Withdraw from Treasury ({treasuryBalance})</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
