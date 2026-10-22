import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Landmark, X, Check, ArrowDownToLine, AlertCircle } from 'lucide-react';

export default function WithdrawModal({
  isOpen,
  onClose,
  treasuryBalance = 0,
  onWithdraw
}) {
  const [passesNeeded, setPassesNeeded] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPassesNeeded(treasuryBalance > 0 ? '1' : '');
      setNote('');
      setError('');
    }
  }, [isOpen, treasuryBalance]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const countNum = Number(passesNeeded);
  const isOverBalance = countNum > treasuryBalance;
  const isInvalid = !passesNeeded || countNum <= 0 || isOverBalance;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isInvalid) {
      if (isOverBalance) {
        setError(`Cannot withdraw more than ${treasuryBalance} available passes.`);
      } else {
        setError('Please enter a valid pass count.');
      }
      return;
    }

    onWithdraw(countNum, note.trim());
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
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Withdraw from Treasury
              </h3>
              <p className="text-[11px] text-slate-400">
                Sam Blue Metal Treasury • Govt Treasury Office
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Treasury Balance Banner */}
          <div className="p-3 rounded-lg bg-blue-500/[0.08] border border-blue-500/25 flex items-center justify-between text-slate-300">
            <div>
              <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-semibold">
                Available in Treasury
              </span>
              <span className="text-lg font-extrabold text-blue-400 font-mono tabular-nums">
                {treasuryBalance} Passes
              </span>
            </div>
            <span className="text-[10px] px-2 py-1 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
              Fee: ₹0 (Free)
            </span>
          </div>

          {/* Passes Needed Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold">
                Passes Needed <span className="text-rose-400">*</span>
              </label>
              {treasuryBalance > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPassesNeeded(String(treasuryBalance));
                    setError('');
                  }}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                >
                  Withdraw All ({treasuryBalance})
                </button>
              )}
            </div>
            <div className="relative">
              <ArrowDownToLine className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="number"
                min="1"
                max={treasuryBalance}
                placeholder="e.g. 20"
                value={passesNeeded}
                onChange={(e) => {
                  setPassesNeeded(e.target.value);
                  setError('');
                }}
                className={`w-full bg-slate-900 border rounded-lg pl-9 pr-3 py-2 text-white font-mono focus:outline-none tabular-nums ${
                  isOverBalance
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-white/[0.1] focus:border-blue-400'
                }`}
                required
              />
            </div>
            {isOverBalance ? (
              <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" />
                <span>Cannot exceed available balance of {treasuryBalance} passes.</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-1">
                Withdrawn passes will have <strong>no validity and no expiry</strong>. They remain usable until consumed.
              </p>
            )}
          </div>

          {/* Optional Note */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Note / Reference (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Withdrawn for customer lorry dispatches"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-900 border border-white/[0.1] rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-400"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[11px]">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/[0.08] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isInvalid || treasuryBalance === 0}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
                !isInvalid && treasuryBalance > 0
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-white/[0.06] cursor-not-allowed opacity-60'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Confirm Withdrawal</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
