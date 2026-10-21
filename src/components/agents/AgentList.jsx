import React, { useState, useMemo } from 'react';
import { Plus, Search, Users, UserPlus } from 'lucide-react';
import AgentCard from './AgentCard';

export default function AgentList({
  agents,
  sales,
  selectedAgent,
  onSelectAgent,
  onAddAgent,
  onEditAgent,
  onToggleStatus,
  onDeleteAgent,
  getAgentStats,
  topAgentName,
  onToast
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Inactive'

  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchSearch =
        agent.name.toLowerCase().includes(search.toLowerCase()) ||
        agent.phone.toLowerCase().includes(search.toLowerCase()) ||
        (agent.company && agent.company.toLowerCase().includes(search.toLowerCase())) ||
        (agent.location && agent.location.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        statusFilter === 'All' || agent.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [agents, search, statusFilter]);

  const activeCount = agents.filter(a => a.status === 'Active').length;

  return (
    <div className="space-y-4">
      {/* Top Header Row with Title, Search, Filter & Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3.5">
        <div className="flex items-center gap-2.5 min-w-[200px]">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Quarry Agents</span>
              <span className="text-[11px] px-2 py-0.2 rounded-full font-semibold bg-slate-800 text-slate-400 border border-white/[0.06]">
                {activeCount} Active
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Manage buyers, agencies, sub-buyer hierarchies & lorry dispatch links
            </p>
          </div>
        </div>

        {/* Right Action Toolbar: Filter Chips, Search, & "+ Add Agent" button with flex-wrap */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter Chips */}
          <div className="flex items-center bg-slate-900 border border-white/[0.06] rounded-lg p-0.5 text-xs shrink-0">
            {['All', 'Active', 'Inactive'].map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-slate-800 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search agent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 text-xs text-white pl-8 pr-3 py-1.5 rounded-lg border border-white/[0.08] placeholder-slate-500 focus:outline-none focus:border-amber-400 w-36 sm:w-44"
            />
          </div>

          {/* "+ Add Agent" Amber Ghost Button (Always visible, shrink-0) */}
          <button
            onClick={onAddAgent}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 hover:text-amber-300 border border-amber-500/30 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Agent</span>
          </button>
        </div>
      </div>

      {/* Agents Grid with min 300px per card and equal heights */}
      {filteredAgents.length > 0 && (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))'
          }}
        >
          {filteredAgents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isSelected={selectedAgent === agent.name}
              isTopAgent={agent.name === topAgentName}
              stats={getAgentStats(agent.name, sales)}
              onSelect={() => onSelectAgent(agent.name)}
              onEdit={onEditAgent}
              onToggleStatus={onToggleStatus}
              onDelete={onDeleteAgent}
              onToast={onToast}
            />
          ))}

          {/* Dashed-border "+ New Agent" Card with equal height in same grid */}
          <div
            onClick={onAddAgent}
            className="p-5 rounded-xl border border-dashed border-white/[0.15] hover:border-amber-500/50 bg-[#111827]/40 hover:bg-slate-800/40 transition-all flex flex-col items-center justify-center text-center cursor-pointer group h-full min-h-[170px]"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-amber-500/15 border border-white/[0.08] group-hover:border-amber-500/30 flex items-center justify-center text-slate-400 group-hover:text-amber-400 transition mb-2">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition">
              + New Agent
            </span>
            <span className="text-[10px] text-slate-500 group-hover:text-slate-400 mt-0.5">
              Register buyer agency
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <div className="py-12 text-center rounded-xl bg-[#111827] border border-white/[0.06] p-6 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-amber-400 mx-auto border border-amber-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              {agents.length === 0 ? 'No agents yet' : 'No agents match your filter'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {agents.length === 0
                ? 'No agents yet. Add your first agent to start recording sales.'
                : search
                ? `No agents matching "${search}". Try searching another name or phone number.`
                : 'No agents registered under this category yet.'}
            </p>
          </div>
          <button
            onClick={onAddAgent}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition inline-flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Agent</span>
          </button>
        </div>
      )}
    </div>
  );
}
