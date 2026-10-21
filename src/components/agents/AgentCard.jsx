import React, { useState, useRef, useEffect } from 'react';
import { Award, MoreVertical, Edit2, Power, Trash2, MapPin, Building, Phone, Copy, Check } from 'lucide-react';

export default function AgentCard({
  agent,
  isSelected,
  isTopAgent,
  stats,
  onSelect,
  onEdit,
  onToggleStatus,
  onDelete,
  onToast
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Color generator for avatar based on name
  const getGradient = (name = '') => {
    const gradients = [
      'from-amber-500/30 to-amber-600/10 text-amber-400 border-amber-500/30',
      'from-emerald-500/30 to-emerald-600/10 text-emerald-400 border-emerald-500/30',
      'from-blue-500/30 to-blue-600/10 text-blue-400 border-blue-500/30',
      'from-purple-500/30 to-purple-600/10 text-purple-400 border-purple-500/30',
      'from-rose-500/30 to-rose-600/10 text-rose-400 border-rose-500/30'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return gradients[Math.abs(hash) % gradients.length];
  };

  // Format phone strictly as "+91 98765 43210" on one single line
  const formatPhone = (phone = '') => {
    const raw = phone.replace(/\D/g, '');
    if (raw.length === 10) {
      return `+91 ${raw.slice(0, 5)} ${raw.slice(5)}`;
    }
    if (raw.length === 12 && raw.startsWith('91')) {
      return `+91 ${raw.slice(2, 7)} ${raw.slice(7)}`;
    }
    return phone;
  };

  const formattedPhone = formatPhone(agent.phone);
  const telHref = `tel:${agent.phone.replace(/[^\d+]/g, '')}`;

  const handleCopyPhone = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(formattedPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onToast) {
        onToast(`Copied ${formattedPhone} to clipboard`);
      }
    }
  };

  const loadText = stats.totalLoads === 1 ? '1 Load' : `${stats.totalLoads} Loads`;

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border transition-all cursor-pointer relative card-shine group flex flex-col justify-between h-full min-w-0 ${
        isSelected
          ? 'bg-slate-800/70 border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
          : 'bg-[#111827] border-white/[0.07] hover:border-white/[0.14] hover:-translate-y-0.5'
      } ${agent.status === 'Inactive' ? 'opacity-70' : ''}`}
    >
      {/* Top Body Section */}
      <div className="space-y-3">
        {/* Row 1: Avatar | Name (flex-1) | Status badge | Menu (fixed right) */}
        <div className="flex items-center gap-3 w-full">
          {/* Avatar */}
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-tr border font-bold text-sm flex items-center justify-center shrink-0 shadow-inner ${getGradient(
              agent.name
            )}`}
          >
            {agent.name.charAt(0).toUpperCase()}
          </div>

          {/* Name taking full available space */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <h4
              className="text-sm font-bold text-white tracking-tight truncate leading-snug"
              title={agent.name}
            >
              {agent.name}
            </h4>
            {agent.status === 'Inactive' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0 font-medium">
                Inactive
              </span>
            )}
          </div>

          {/* ⋮ Menu fixed to the right */}
          <div className="relative shrink-0" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Agent Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-[#0E131F] border border-white/[0.12] rounded-xl shadow-2xl py-1 z-30 card-shine text-xs">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(agent);
                  }}
                  className="w-full px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800/70 flex items-center gap-2 transition"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit Agent</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleStatus(agent);
                  }}
                  className="w-full px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800/70 flex items-center gap-2 transition"
                >
                  <Power className={`w-3.5 h-3.5 ${agent.status === 'Active' ? 'text-slate-400' : 'text-emerald-400'}`} />
                  <span>{agent.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                </button>

                <div className="my-1 border-t border-white/[0.06]" />

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(agent);
                  }}
                  className="w-full px-3 py-2 text-left text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Agent</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Phone number on its own full-width line with click-to-call & copy */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-white/[0.05] group/phone hover:border-amber-500/30 transition-colors"
        >
          <a
            href={telHref}
            className="flex items-center gap-2 text-[13px] font-mono tabular-nums text-slate-300 hover:text-amber-300 transition-colors whitespace-nowrap min-w-0"
            style={{ whiteSpace: 'nowrap' }}
            title="Click to call agent"
          >
            <Phone className="w-3.5 h-3.5 text-slate-400 group-hover/phone:text-amber-400 shrink-0 transition-colors" />
            <span className="whitespace-nowrap font-medium tracking-tight">
              {formattedPhone}
            </span>
          </a>

          <button
            type="button"
            onClick={handleCopyPhone}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 ml-1.5"
            title={copied ? 'Copied!' : 'Copy number'}
          >
            {copied ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-sans font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copied</span>
              </span>
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Company & Location: Stacked into two separate lines */}
        {(agent.company || agent.location) && (
          <div className="space-y-1.5 text-xs pt-0.5">
            {agent.company && (
              <div
                className="flex items-center gap-2 text-slate-300 min-w-0 truncate"
                title={agent.company}
              >
                <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate font-medium">{agent.company}</span>
              </div>
            )}
            {agent.location && (
              <div
                className="flex items-center gap-2 text-slate-400 min-w-0 truncate"
                title={agent.location}
              >
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{agent.location}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Metrics Row: Loads, Top Agent Badge, Clients, Amount */}
      <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-slate-400 font-medium whitespace-nowrap">{loadText}</span>

          {/* Top Agent Badge placed cleanly beside Loads count without squeezing header */}
          {isTopAgent && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap shrink-0">
              <Award className="w-3 h-3 text-amber-400" />
              <span>Top Agent</span>
            </span>
          )}

          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400 font-medium whitespace-nowrap hidden sm:inline">
            {(agent.subBuyers || []).length} Clients
          </span>
        </div>

        <span className="font-bold text-emerald-400 tabular-nums whitespace-nowrap shrink-0 ml-2">
          ₹{stats.totalAmount.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
}
