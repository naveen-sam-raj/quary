import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, X, Check, Clock } from 'lucide-react';
import { addDaysToDate, formatPassDate } from '../../utils/passHelpers';

export default function EditDueDateModal({ isOpen, onClose, batch, onSave }) {
  const [issueDate, setIssueDate] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (batch) {
      setIssueDate(batch.issueDate || batch.date || '');
      setValidityDays(batch.validityDays || 30);
      setDueDate(batch.dueDate || addDaysToDate(batch.issueDate || batch.date, batch.validityDays || 30));
    }
  }, [batch, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !batch) return null;

  const handleValidityChange = (days) => {
    setValidityDays(days);
    if (issueDate) {
      setDueDate(addDaysToDate(issueDate, days));
    }
  };

  const handleIssueDateChange = (date) => {
    setIssueDate(date);
    if (validityDays) {
      setDueDate(addDaysToDate(date, validityDays));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(batch.id, {
      issueDate,
      validityDays: Number(validityDays),
      dueDate
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
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Update Expiry / Due Date
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
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Issue Date</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => handleIssueDateChange(e.target.value)}
              className="w-full bg-slate-900 border border-white/[0.1] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Validity (Days)</label>
              <input
                type="number"
                min="1"
                value={validityDays}
                onChange={(e) => handleValidityChange(e.target.value)}
                className="w-full bg-slate-900 border border-white/[0.1] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400 tabular-nums"
                required
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Due / Expiry Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-900 border border-white/[0.1] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-white/[0.05] text-[11px] text-slate-400">
            Passes in this batch will expire on <strong className="text-white">{formatPassDate(dueDate)}</strong>.
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
              className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Update Due Date</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
