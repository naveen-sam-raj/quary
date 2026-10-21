import React from 'react';
import { motion } from 'framer-motion';
import { Truck, X, FileCheck2, Calendar } from 'lucide-react';
import { formatPassDate } from '../../utils/passHelpers';

export default function ViewUsageModal({ isOpen, onClose, batch, sales = [], formatDate }) {
  if (!isOpen || !batch) return null;

  // Recent sales that consumed passes
  const salesWithPasses = sales.filter(s => Number(s.passesUsed) > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        className="bg-[#0E131F] border border-white/[0.12] rounded-xl max-w-lg w-full p-6 shadow-2xl card-shine relative"
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Batch Pass Deductions & History
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {batch.batchNo} • {batch.usedPasses || 0} of {batch.passesBought} passes used
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs max-h-80 overflow-y-auto">
          <div className="p-3 rounded-lg bg-slate-900/80 border border-white/[0.05] grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Total Bought</span>
              <span className="font-bold text-white tabular-nums">{batch.passesBought}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Used in Lorry Dispatches</span>
              <span className="font-bold text-amber-400 tabular-nums">{batch.usedPasses || 0}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Remaining / Unused</span>
              <span className="font-bold text-emerald-400 tabular-nums">
                {Math.max(0, batch.passesBought - (batch.usedPasses || 0) - (batch.surrenderedPasses || 0))}
              </span>
            </div>
          </div>

          <h4 className="text-xs font-bold text-slate-300 pt-2">Recent Dispatches Deducting Transit Passes:</h4>

          <div className="space-y-2">
            {salesWithPasses.slice(0, 8).map(s => (
              <div
                key={s.id}
                className="p-2.5 rounded-lg bg-slate-900 border border-white/[0.06] flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <div>
                    <span className="font-mono font-bold text-white block">{s.lorryNo}</span>
                    <span className="text-[10px] text-slate-400 block">
                      {s.agentName} → {s.subBuyerName} • {formatPassDate(s.date)}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  -{s.passesUsed} {s.passesUsed === 1 ? 'Pass' : 'Passes'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-white/[0.06] mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
