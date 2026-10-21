import React, { useState, useEffect } from 'react';
import { Search, X, TrendingUp, ShoppingCart, Truck, User } from 'lucide-react';

export default function GlobalSearchModal({
  isOpen,
  onClose,
  sales,
  purchases,
  agents,
  onSelectResult
}) {
  const [query, setQuery] = useState('');

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Toggle handled by parent
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Search results
  const matchedSales = q
    ? sales.filter(
        s =>
          s.lorryNo.toLowerCase().includes(q) ||
          s.agentName.toLowerCase().includes(q) ||
          s.subBuyerName.toLowerCase().includes(q) ||
          s.material.toLowerCase().includes(q)
      ).slice(0, 5)
    : [];

  const matchedPurchases = q
    ? purchases.filter(
        p =>
          p.vendor.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      ).slice(0, 5)
    : [];

  const matchedAgents = q
    ? agents.filter(
        a =>
          a.name.toLowerCase().includes(q) ||
          a.subBuyers.some(sub => sub.toLowerCase().includes(q))
      ).slice(0, 3)
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 pt-20">
      <div className="bg-[#0E131F] border border-white/[0.12] rounded-xl max-w-xl w-full shadow-2xl overflow-hidden card-shine animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-white/[0.08] flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a lorry number, agent, sub-buyer, or vendor..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-3">
          {!q && (
            <div className="py-8 text-center text-xs text-slate-500">
              Search by lorry number (e.g. "TN 45"), agent ("Naveen"), or vendor ("JCB").
            </div>
          )}

          {/* Agents */}
          {matchedAgents.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2">
                Quarry Agents
              </div>
              {matchedAgents.map(ag => (
                <div
                  key={ag.id}
                  onClick={() => {
                    onSelectResult({ type: 'agent', value: ag.name });
                    onClose();
                  }}
                  className="p-2.5 rounded-lg hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-semibold text-white">{ag.name}</span>
                    <span className="text-xs text-slate-400">({ag.subBuyers.join(', ')})</span>
                  </div>
                  <span className="text-xs text-slate-500 group-hover:text-amber-400 transition">
                    View Sales →
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Sales / Lorries */}
          {matchedSales.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2">
                Lorry Dispatches (Sales)
              </div>
              {matchedSales.map(s => (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectResult({ type: 'tab', tab: 'sales' });
                    onClose();
                  }}
                  className="p-2.5 rounded-lg hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        {s.lorryNo} • <span className="text-slate-400">{s.material}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {s.agentName} → {s.subBuyerName} • {s.date}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 tabular-nums">
                    ₹{Number(s.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Purchases */}
          {matchedPurchases.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2">
                Purchases & Operational Outflow
              </div>
              {matchedPurchases.map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectResult({ type: 'tab', tab: 'purchase' });
                    onClose();
                  }}
                  className="p-2.5 rounded-lg hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingCart className="w-4 h-4 text-rose-400" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        {p.vendor} • <span className="text-slate-400">{p.category}</span>
                      </div>
                      <div className="text-xs text-slate-500">{p.description}</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-rose-400 tabular-nums">
                    ₹{Number(p.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {q && matchedAgents.length === 0 && matchedSales.length === 0 && matchedPurchases.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              No results found for "{query}".
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-slate-900/60 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500">
          <span>Navigate with mouse or keyboard</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
