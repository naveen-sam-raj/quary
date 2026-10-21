import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Users, User, Phone, MapPin, Check } from 'lucide-react';

export default function SubBuyerModal({
  isOpen,
  onClose,
  onSave,
  agents = [],
  defaultAgentName = ''
}) {
  const nameInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    agentName: defaultAgentName || (agents[0]?.name || ''),
    location: ''
  });

  const [error, setError] = useState('');

  useEffect(() => {
    setFormData({
      name: '',
      phone: '',
      agentName: defaultAgentName || (agents[0]?.name || ''),
      location: ''
    });
    setError('');

    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultAgentName, agents]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = formData.name.trim();
    if (!trimmed) {
      setError('Sub-buyer name is required');
      return;
    }

    const targetAgent = agents.find(a => a.name === formData.agentName);
    onSave({
      agentId: targetAgent ? targetAgent.id : '',
      agentName: formData.agentName,
      name: trimmed,
      phone: formData.phone.trim(),
      location: formData.location.trim()
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-[#0E131F] border border-white/[0.12] rounded-xl max-w-md w-full p-6 shadow-2xl card-shine"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Add Sub-Buyer / Client
              </h3>
              <p className="text-[11px] text-slate-400">
                Register a client purchasing under a quarry agent
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Parent Agent Dropdown */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Parent Agent <span className="text-rose-400">*</span>
            </label>
            <select
              value={formData.agentName}
              onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
              className="w-full bg-slate-900 border border-white/[0.1] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
            >
              {agents.map(a => (
                <option key={a.id} value={a.name}>
                  {a.name} {a.status === 'Inactive' ? '(Inactive)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Sub-Buyer Name */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Sub-Buyer Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                ref={nameInputRef}
                type="text"
                placeholder="e.g. Sam, Ganesan, Prabhu"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (error) setError('');
                }}
                className={`w-full bg-slate-900 border rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-600 focus:outline-none transition ${
                  error ? 'border-rose-500 focus:border-rose-500' : 'border-white/[0.1] focus:border-amber-400'
                }`}
              />
            </div>
            {error && <p className="text-[11px] text-rose-400 mt-1">{error}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="text-slate-300 font-medium block mb-1">Phone Number (Optional)</label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="tel"
                placeholder="e.g. 98765 00001"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-900 border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Site / Location */}
          <div>
            <label className="text-slate-300 font-medium block mb-1">Delivery Site / Location (Optional)</label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. Tiruchengode By-pass site"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-900 border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/[0.08] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Sub-Buyer</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
