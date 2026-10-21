import React from 'react';
import { Building2, AlertTriangle } from 'lucide-react';

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab,
  stats,
  hasExpiringPasses = false
}) {
  const navSections = [
    {
      label: 'OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Main Dashboard' },
        { id: 'sales', label: 'Sales (Agent Tree)' },
        { id: 'purchase', label: 'Purchases & Rent' },
        { id: 'reports', label: 'Reports & Statements' }
      ]
    },
    {
      label: 'COMPLIANCE',
      items: [
        { id: 'pass', label: 'Govt Pass Tracker' }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar Container: 248px expanded, 64px collapsed on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#0B0F17] border-r border-white/[0.06] flex flex-col justify-between transition-all duration-200 ease-in-out shrink-0 lg:static lg:h-screen lg:sticky lg:top-0 ${
          sidebarOpen
            ? 'w-[248px] translate-x-0'
            : '-translate-x-full lg:translate-x-0 lg:w-[64px]'
        }`}
      >
        <div className="w-full flex flex-col h-full justify-between overflow-hidden">
          {/* Top Section */}
          <div className="flex flex-col min-w-0">
            {/* Sidebar Header */}
            {sidebarOpen ? (
              <div className="h-16 px-4 border-b border-white/[0.06] flex items-center min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-sm font-bold tracking-tight text-white leading-tight truncate">
                      BLUE METAL
                    </h1>
                    <span className="text-[12px] text-slate-500 font-medium tracking-wide block truncate">
                      Enterprise ERP v2.4
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-16 flex items-center justify-center border-b border-white/[0.06]">
                <div
                  className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 cursor-pointer"
                  title="BLUE METAL • Enterprise ERP v2.4"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
            )}

            {/* Navigation Menus */}
            <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)]">
              {navSections.map((section, sIdx) => (
                <div key={sIdx}>
                  {/* Section Label */}
                  {sidebarOpen ? (
                    <div className="px-4 mt-6 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
                      {section.label}
                    </div>
                  ) : (
                    <div className="mt-4 mb-2 border-t border-white/[0.04]" />
                  )}

                  {/* Nav Items List */}
                  <div className="space-y-1">
                    {section.items.map(item => {
                      const isActive = activeTab === item.id;

                      if (sidebarOpen) {
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                                setSidebarOpen(false);
                              }
                            }}
                            className={`w-full h-[40px] px-4 rounded-lg text-[14px] transition-colors duration-150 relative flex items-center text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 ${
                              isActive
                                ? 'bg-amber-500/[0.08] text-[#F59E0B] font-semibold'
                                : 'text-slate-400 font-medium hover:bg-white/[0.04] hover:text-slate-200'
                            }`}
                          >
                            {/* Thin 3px amber bar on the left edge for active item */}
                            {isActive && (
                              <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#F59E0B] rounded-r" />
                            )}
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      }

                      // Collapsed Mode: 36px rounded square with first letter & tooltip
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                          }}
                          title={item.label}
                          className={`w-9 h-9 mx-auto rounded-lg text-xs font-semibold flex items-center justify-center transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 ${
                            isActive
                              ? 'bg-amber-500/[0.12] text-[#F59E0B] border border-amber-500/30'
                              : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                          }`}
                        >
                          {item.label.charAt(0)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Bottom Footer Section */}
          {sidebarOpen ? (
            <div className="p-3 border-t border-white/[0.06] bg-[#0B0F17] space-y-3">
              {/* Govt Passes mini card */}
              {(activeTab === 'dashboard' || activeTab === 'pass') && (
                <div
                  onClick={() => {
                    setActiveTab('pass');
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">Govt Passes</span>
                      {hasExpiringPasses && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" title="Pass batch expiring soon!" />
                      )}
                    </div>
                    <span className="font-semibold text-amber-500 tabular-nums">
                      {stats.remainingPasses} left
                    </span>
                  </div>

                  {/* Slim 4px progress bar */}
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-[#F59E0B] h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((stats.remainingPasses / (stats.totalPassesBought || 1)) * 100)
                        )}%`
                      }}
                    />
                  </div>

                  {/* Single small line */}
                  <div className="text-[11px] text-slate-500 mt-1.5 tabular-nums">
                    {stats.totalPassesUsed} of {stats.totalPassesBought} used
                  </div>
                </div>
              )}

              {/* Thin Divider & User Profile Block */}
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/[0.08] text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                      NS
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate">Naveen Sam</div>
                      <div className="text-[11px] text-slate-500 truncate">Quarry Manager</div>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="System Online" />
                </div>
              </div>

              {/* Developed by devozz */}
              <div className="pt-2 border-t border-white/[0.05] text-center text-[11px] text-slate-500">
                Developed by <span className="text-slate-400 font-medium">devozz</span>
              </div>
            </div>
          ) : (
            /* Collapsed Mode Footer */
            <div className="p-2 border-t border-white/[0.06] bg-[#0B0F17] flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-full bg-slate-800 border border-white/[0.08] text-amber-400 font-bold text-xs flex items-center justify-center cursor-pointer"
                title="Naveen Sam • Quarry Manager"
              >
                NS
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
