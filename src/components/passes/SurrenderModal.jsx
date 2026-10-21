import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldOff, X, AlertTriangle, Check } from 'lucide-react';
import { getBatchStatus } from '../../utils/passHelpers';

export default function SurrenderModal({ isOpen, onClose, batch, onSurrender, today }) {
  const [note, setNote] = useState('');

  useEffect(() => {
    setNote('');
  }, [batch, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !batch) return null;

  const statusInfo = getBatchStatus(batch, today);
  const unused = statusInfo.unused;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSurrender(batch.id, {
      surrenderedPasses: unused,
      surrenderNote: note.trim() || 'Returned to Department of Geology & Mining',
      surrenderDate: new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        className="bg-[#0E131F] border border-white/[0.12] rounded-xl max-w-md w-full p-6 shadow-2xl card-shine relative"
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldOff className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Surrender Passes to Department
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Batch: {batch.batchNo}
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-blue-500/[0.08] border border-blue-500/20 text-slate-300 space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span>Unused Passes to Surrender:</span>
              <span className="font-bold text-blue-400 font-mono text-sm">{unused} Passes</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Surrendered passes will be officially marked as returned to the Department. They will not be counted in available stock, nor marked as a financial loss.
            </p>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Surrender Note / Reason <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Returned to Geology & Mining office due to permit renewal / quota adjustment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-900 border border-white/[0.1] rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/[0.08] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Surrender</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
