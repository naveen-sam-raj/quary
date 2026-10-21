import React from 'react';

export default function KpiCard({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  accentColor = 'amber',
  sparklineData = [10, 15, 12, 18, 14, 22, 28],
  onClick,
  extraBadge
}) {
  // Color configuration based on design system
  const colorStyles = {
    emerald: {
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      stroke: '#10B981',
      trendBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    rose: {
      iconBg: 'bg-rose-500/10 text-rose-400',
      stroke: '#F43F5E',
      trendBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    },
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-400',
      stroke: '#F59E0B',
      trendBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    },
    slate: {
      iconBg: 'bg-slate-800 text-slate-300',
      stroke: '#94A3B8',
      trendBg: 'bg-slate-800 text-slate-300 border-slate-700'
    }
  };

  const currentTheme = colorStyles[accentColor] || colorStyles.amber;

  // Calculate SVG path for sparkline
  const minVal = Math.min(...sparklineData);
  const maxVal = Math.max(...sparklineData);
  const range = maxVal - minVal || 1;
  const width = 80;
  const height = 28;
  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div
      onClick={onClick}
      className={`relative group rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] hover:border-white/[0.16] transition-all duration-200 card-shine flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            {title}
          </span>
          <div className="flex items-center gap-2">
            {extraBadge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-800/80 text-slate-300 border border-white/[0.06]">
                {extraBadge}
              </span>
            )}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${currentTheme.iconBg}`}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Main Value & Sparkline */}
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="text-2xl sm:text-[28px] font-bold text-white tracking-tight tabular-nums leading-none">
            {value}
          </div>

          {/* Mini Sparkline */}
          <div className="hidden sm:block shrink-0">
            <svg width={width} height={height} className="overflow-visible">
              <polyline
                fill="none"
                stroke={currentTheme.stroke}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className="opacity-75 group-hover:opacity-100 transition-opacity"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Footer / Trend helper line */}
      <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between gap-2 text-xs text-slate-400">
        <span className="text-[11px] text-slate-400 leading-tight">{subValue}</span>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border shrink-0 ${
              trend.isPositive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : trend.isNegative
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {trend.isPositive ? '▲' : trend.isNegative ? '▼' : '•'} {trend.text}
          </span>
        )}
      </div>
    </div>
  );
}
