import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Building, MapPin, Percent, Wallet, FileText, Check } from 'lucide-react';

export default function AgentModal({
  isOpen,
  onClose,
  onSave,
  initialAgent = null,
  existingAgents = []
}) {
  const nameInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: '',
    location: '',
    commission: '',
    openingBalance: '',
    status: 'Active',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (initialAgent) {
      // Strip '+91 ' if user typed raw digits or format
      const cleanPhone = initialAgent.phone?.replace(/^\+91\s*/, '') || '';
      setFormData({
        name: initialAgent.name || '',
        phone: cleanPhone,
        company: initialAgent.company || '',
        location: initialAgent.location || '',
        commission: initialAgent.commission !== undefined ? String(initialAgent.commission) : '',
        openingBalance: initialAgent.openingBalance !== undefined ? String(initialAgent.openingBalance) : '',
        status: initialAgent.status || 'Active',
        notes: initialAgent.notes || ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        company: '',
        location: '',
        commission: '',
        openingBalance: '',
        status: 'Active',
        notes: ''
      });
    }
    setErrors({});
    setTouched({});

    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [isOpen, initialAgent]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Validation
  const validate = (data) => {
    const newErrors = {};

    if (!data.name.trim()) {
      newErrors.name = 'Agent name is required';
    } else if (data.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const rawDigits = data.phone.replace(/\D/g, '');
    if (!data.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (rawDigits.length !== 10) {
      newErrors.phone = 'Enter a valid 10-digit mobile number';
    } else {
      // Check duplicate
      const fullPhone = `+91 ${rawDigits.slice(0, 5)} ${rawDigits.slice(5)}`;
      const isDuplicate = existingAgents.some(
        a => a.phone?.replace(/\s+/g, '') === fullPhone.replace(/\s+/g, '') && a.id !== initialAgent?.id
      );
      if (isDuplicate) {
        newErrors.phone = 'Phone number already registered with another agent';
      }
    }

    if (data.commission && (Number(data.commission) < 0 || Number(data.commission) > 100)) {
      newErrors.commission = 'Commission must be between 0% and 100%';
    }

    return newErrors;
  };

  const handleChange = (field, value) => {
    const nextData = { ...formData, [field]: value };
    setFormData(nextData);
    if (touched[field]) {
      setErrors(validate(nextData));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(validate(formData));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    setTouched({
      name: true,
      phone: true,
      commission: true
    });

    if (Object.keys(validationErrors).length > 0) return;

    const rawDigits = formData.phone.replace(/\D/g, '');
    const formattedPhone = `+91 ${rawDigits.slice(0, 5)} ${rawDigits.slice(5)}`;

    onSave({
      ...formData,
      phone: formattedPhone
    });
    onClose();
  };

  if (!isOpen) return null;

  const currentErrors = validate(formData);
  const isFormValid = Object.keys(currentErrors).length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-[#0E131F] border border-white/[0.12] rounded-xl max-w-lg w-full p-6 shadow-2xl card-shine my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {initialAgent ? 'Edit Agent Profile' : 'Add New Quarry Agent'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Register agent details, commission rate, and active status
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
          {/* Agent Name */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Agent Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                ref={nameInputRef}
                type="text"
                placeholder="e.g. Naveen, Murugan Agencies"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                className={`w-full bg-slate-900 border rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-600 focus:outline-none transition ${
                  touched.name && errors.name
                    ? 'border-rose-500/80 focus:border-rose-500'
                    : 'border-white/[0.1] focus:border-amber-400'
                }`}
              />
            </div>
            {touched.name && errors.name && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Mobile Number <span className="text-rose-400">*</span>
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-white/[0.1] bg-slate-800 text-slate-400 text-xs font-mono">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                placeholder="98765 43210"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                onBlur={() => handleBlur('phone')}
                className={`w-full bg-slate-900 border rounded-r-lg px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none transition ${
                  touched.phone && errors.phone
                    ? 'border-rose-500/80 focus:border-rose-500'
                    : 'border-white/[0.1] focus:border-amber-400'
                }`}
              />
            </div>
            {touched.phone && errors.phone && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Company & Location in 2 cols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Company / Agency Name</label>
              <div className="relative">
                <Building className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Rockstone Logistics"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">City / Location</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Namakkal, Salem"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Commission & Opening Balance in 2 cols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Commission Rate (%)</label>
              <div className="relative">
                <Percent className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  placeholder="e.g. 5"
                  value={formData.commission}
                  onChange={(e) => handleChange('commission', e.target.value)}
                  onBlur={() => handleBlur('commission')}
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-white tabular-nums placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>
              {touched.commission && errors.commission && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.commission}</p>
              )}
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Opening Advance / Balance (₹)</label>
              <div className="relative">
                <Wallet className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={formData.openingBalance}
                  onChange={(e) => handleChange('openingBalance', e.target.value)}
                  className="w-full bg-slate-900 border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-white tabular-nums placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Status Switch */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-white/[0.06]">
            <div>
              <span className="font-semibold text-white block">Agent Status</span>
              <span className="text-[11px] text-slate-400 block">
                {formData.status === 'Active'
                  ? 'Active agent can dispatch lorries & appear in dropdowns'
                  : 'Inactive agent is hidden from new dispatch dropdowns'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleChange('status', formData.status === 'Active' ? 'Inactive' : 'Active')}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                formData.status === 'Active' ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="text-slate-300 font-medium block mb-1">Internal Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Reliable transporter, prefers 20mm blue metal"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full bg-slate-900 border border-white/[0.1] rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Footer Buttons */}
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
              disabled={!isFormValid}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition shadow-lg flex items-center gap-1.5 cursor-pointer ${
                isFormValid
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{initialAgent ? 'Update Agent' : 'Save Agent'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
