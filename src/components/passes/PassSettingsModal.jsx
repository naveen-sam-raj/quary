import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, X, Check, Clock, AlertTriangle } from 'lucide-react';

export default function PassSettingsModal({ isOpen, onClose, settings, onSaveSettings }) {
  const [validityDays, setValidityDays] = useState(settings?.defaultValidityDays || 30);
  const [warningDays, setWarningDays] = useState(settings?.warningDays || 7);

  useEffect(() => {
    if (settings) {
      setValidityDays(settings.defaultValidityDays || 30);
      setWarningDays(settings.warningDays || 7);
    }
  }, [settings, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings({
      defaultValidityDays: Number(validityDays) || 30,
      warningDays: Number(warningDays) || 7
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
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Govt Pass Expiry Rules & Settings
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure default validity and alert warning thresholds
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
            <label className="text-slate-300 font-semibold block mb-1">
              Default Batch Validity (Days)
            </label>
            <div className="relative">
              <Clock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="number"
                min="1"
                max="365"
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                className="w-full bg-slate-900 border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400 tabular-nums"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              New pass batches will automatically have their due date set to Issue Date + this validity period.
            </p>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Warning Alert Threshold (Days Before Expiry)
            </label>
            <div className="relative">
              <AlertTriangle className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="number"
                min="1"
                max="30"
                value={warningDays}
                onChange={(e) => setWarningDays(e.target.value)}
                className="w-full bg-slate-900 border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400 tabular-nums"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Batches with fewer than this many days remaining will display as &quot;Expiring Soon&quot; and trigger dashboard warnings.
            </p>
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
              <span>Save Rules</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
