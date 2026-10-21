import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, XCircle, Archive, ShieldOff } from 'lucide-react';

export default function BatchStatusBadge({ statusInfo }) {
  if (!statusInfo) return null;

  const { status, label, color } = statusInfo;

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
    'Expired': {
      bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      dot: 'bg-rose-400',
      icon: XCircle
    },
    'Exhausted': {
      bg: 'bg-slate-800 text-slate-400 border-white/[0.06]',
      dot: 'bg-slate-500',
      icon: Archive
    },
    'Surrendered': {
      bg: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
      dot: 'bg-blue-400',
      icon: ShieldOff
    }
  };

  const current = configs[status] || configs['Active'];
  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tabular-nums whitespace-nowrap ${current.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />
      <Icon className="w-3 h-3 shrink-0" />
      <span>{label}</span>
    </span>
  );
}
