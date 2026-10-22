import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, Archive, Landmark, ShieldOff, XCircle } from 'lucide-react';

export default function BatchStatusBadge({ statusInfo, showTreasuryTag = false }) {
  if (!statusInfo) return null;

  const { status, label, isTreasury } = statusInfo;

  const configs = {
    'Active': {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
      dot: 'bg-emerald-400',
      icon: CheckCircle2
    },
    'Expiring Soon': {
      bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-sm shadow-amber-500/10',
      dot: 'bg-amber-400 animate-pulse',
      icon: AlertTriangle
    },
    'Returned to Treasury': {
      bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      dot: 'bg-blue-400',
      icon: Landmark
    },
    'Exhausted': {
      bg: 'bg-slate-800 text-slate-400 border-white/[0.06]',
      dot: 'bg-slate-500',
      icon: Archive
    },
    'Expired': {
      bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      dot: 'bg-rose-400',
      icon: XCircle
    },
    'Surrendered': {
      bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
      dot: 'bg-indigo-400',
      icon: ShieldOff
    }
  };

  const current = configs[status] || configs['Active'];
  const Icon = current.icon;

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      {showTreasuryTag && isTreasury && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
          <Landmark className="w-2.5 h-2.5" />
          <span>Treasury</span>
        </span>
      )}
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tabular-nums whitespace-nowrap ${current.bg}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />
        <Icon className="w-3 h-3 shrink-0" />
        <span>{label}</span>
      </span>
    </div>
  );
}
