import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Truck,
  Users,
  Plus,
  Search,
  AlertTriangle,
  FileCheck2,
  Clock
} from 'lucide-react';
import KpiCard from '../KpiCard';
import AgentList from '../agents/AgentList';
import AgentModal from '../agents/AgentModal';
import SubBuyerModal from '../agents/SubBuyerModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { getNextBatchForDispatch, getValidPassCount } from '../../utils/passHelpers';

export default function SalesView({
  sales,
  passBatches = [],
  agents = [],
  selectedAgent,
  setSelectedAgent,
  selectedSubBuyer,
  setSelectedSubBuyer,
  searchQuery,
  setSearchQuery,
  filteredSales,
  newSale,
  setNewSale,
  handleAddSale,
  handleAddAgent,
  handleUpdateAgent,
  handleDeleteAgent,
  handleToggleStatus,
  handleAddSubBuyer,
  getAgentStats,
  topAgentName,
  showToast,
  formatDate
}) {
  // Modal & Dialog states
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [isSubBuyerModalOpen, setIsSubBuyerModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    confirmVariant: 'danger',
    onConfirm: () => {}
  });

  const totalSalesAmount = sales.reduce((acc, s) => acc + Number(s.amount || 0), 0);
  const totalLoadsCount = sales.length;
  const loadText = totalLoadsCount === 1 ? '1 Load' : `${totalLoadsCount} Loads`;

  const activeAgents = useMemo(() => agents.filter(a => a.status === 'Active'), [agents]);

  // FIFO Pass Batch Information & Availability
  const nextBatch = useMemo(() => getNextBatchForDispatch(passBatches), [passBatches]);
  const validPassCount = useMemo(() => getValidPassCount(passBatches), [passBatches]);
  const requestedPasses = Number(newSale.passesUsed || 0);
  const isPassInsufficient = requestedPasses > validPassCount;
  const isNoPassesAvailable = validPassCount === 0;

  // Compute top agent if not provided from hook
  const computedTopAgent = useMemo(() => {
    if (topAgentName !== undefined) return topAgentName;
    let top = null;
    let maxAmt = -1;
    activeAgents.forEach(a => {
      const total = sales
        .filter(s => s.agentName === a.name)
        .reduce((sum, s) => sum + Number(s.amount || 0), 0);
      if (total > maxAmt) {
        maxAmt = total;
        top = a.name;
      }
    });
    return top;
  }, [topAgentName, activeAgents, sales]);

  // Helper for agent stats
  const calcAgentStats = (agentName) => {
    if (getAgentStats) return getAgentStats(agentName, sales);
    const agentSales = sales.filter(s => s.agentName === agentName);
    const totalAmount = agentSales.reduce((acc, s) => acc + Number(s.amount || 0), 0);
    return {
      totalAmount,
      totalLoads: agentSales.length,
      sales: agentSales
    };
  };

  // Sync selectedAgent if current one becomes inactive or deleted
  useEffect(() => {
    if (selectedAgent !== 'ALL' && !agents.some(a => a.name === selectedAgent)) {
      if (activeAgents.length > 0) {
        setSelectedAgent(activeAgents[0].name);
      } else {
        setSelectedAgent('ALL');
      }
    }
  }, [agents, activeAgents, selectedAgent, setSelectedAgent]);

  // Ensure newSale has a valid active agent selected
  useEffect(() => {
    if (activeAgents.length > 0) {
      const isCurrentActive = activeAgents.some(a => a.name === newSale.agentName);
      if (!isCurrentActive) {
        const firstAgent = activeAgents[0];
        const firstSub = firstAgent.subBuyers?.[0] || 'Direct / Unassigned';
        setNewSale(prev => ({ ...prev, agentName: firstAgent.name, subBuyerName: firstSub }));
      }
    }
  }, [activeAgents, newSale.agentName, setNewSale]);

  // Handlers for Agent Management
  const handleOpenAddAgent = () => {
    setEditingAgent(null);
    setIsAgentModalOpen(true);
  };

  const handleOpenEditAgent = (agent) => {
    setEditingAgent(agent);
    setIsAgentModalOpen(true);
  };

  const handleSaveAgentData = (agentFormData) => {
    if (editingAgent) {
      if (handleUpdateAgent) {
        handleUpdateAgent(editingAgent.id, agentFormData);
      }
      if (showToast) showToast('Agent updated successfully');
    } else {
      if (handleAddAgent) {
        handleAddAgent(agentFormData);
      }
      if (showToast) showToast('Agent added successfully');
    }
    setIsAgentModalOpen(false);
    setEditingAgent(null);
  };

  const handleToggleAgentStatus = (agent) => {
    if (handleToggleStatus) {
      handleToggleStatus(agent.id);
      const nextStatus = agent.status === 'Active' ? 'Inactive' : 'Active';
      if (showToast) showToast(`Agent ${agent.name} is now ${nextStatus}`);
    }
  };

  const handleDeleteAgentPrompt = (agent) => {
    const agentSales = sales.filter(s => s.agentName === agent.name);
    const loadCount = agentSales.length;

    if (loadCount > 0) {
      setConfirmDialog({
        isOpen: true,
        title: `Delete agent ${agent.name}?`,
        message: `Delete agent ${agent.name}? Their ${loadCount} ${loadCount === 1 ? 'load' : 'loads'} will remain but be marked as 'Unassigned'.`,
        confirmText: 'Deactivate Agent',
        confirmVariant: 'danger',
        onConfirm: () => {
          if (handleDeleteAgent) handleDeleteAgent(agent.id, true);
          if (showToast) showToast(`Agent ${agent.name} marked as Inactive (${loadCount} loads preserved)`);
        }
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        title: `Delete agent ${agent.name}?`,
        message: `Are you sure you want to delete agent ${agent.name}? This agent has 0 recorded loads.`,
        confirmText: 'Delete Agent',
        confirmVariant: 'danger',
        onConfirm: () => {
          if (handleDeleteAgent) handleDeleteAgent(agent.id, false);
          if (showToast) showToast(`Agent ${agent.name} deleted successfully`);
        }
      });
    }
  };

  const handleSaveSubBuyerData = (subBuyerData) => {
    if (handleAddSubBuyer) {
      handleAddSubBuyer(subBuyerData);
    }
    if (showToast) showToast('Sub-buyer added successfully');
    setIsSubBuyerModalOpen(false);
  };

  // Find sub-buyers for currently selected agent
  const currentAgentObj = agents.find(a => a.name === selectedAgent);
  const currentSubBuyers = currentAgentObj?.subBuyers || [];

  return (
    <motion.div
      key="sales"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="space-y-6"
    >
      {/* 1. Sales-Only Stat Row (Max 3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Total Sales Value"
          value={`₹${totalSalesAmount.toLocaleString('en-IN')}`}
          subValue="Total revenue collected"
          icon={TrendingUp}
          trend={{ text: '14.8% vs last wk', isPositive: true }}
          accentColor="emerald"
          sparklineData={[12, 18, 14, 24, 22, 31, 38]}
        />

        <KpiCard
          title="Total Dispatched Loads"
          value={loadText}
          subValue="Dispatched across all lorries"
          icon={Truck}
          trend={{ text: 'Active dispatches', isPositive: true }}
          accentColor="amber"
          sparklineData={[4, 6, 5, 8, 7, 9, 11]}
        />

        <KpiCard
          title="Active Quarry Agents"
          value={`${activeAgents.length} Agents`}
          subValue={
            activeAgents.length > 0
              ? activeAgents.slice(0, 3).map(a => a.name).join(', ')
              : 'No active agents'
          }
          icon={Users}
          trend={{ text: `${activeAgents.length} active`, isPositive: true }}
          accentColor="slate"
          sparklineData={[3, 3, 3, 3, 3, 3, 3]}
        />
      </div>

      {/* 2. Dynamic Agent Management & Cards Row */}
      <AgentList
        agents={agents}
        sales={sales}
        selectedAgent={selectedAgent}
        onSelectAgent={(agentName) => {
          setSelectedAgent(agentName);
          setSelectedSubBuyer('ALL');
        }}
        onAddAgent={handleOpenAddAgent}
        onEditAgent={handleOpenEditAgent}
        onToggleStatus={handleToggleAgentStatus}
        onDeleteAgent={handleDeleteAgentPrompt}
        getAgentStats={calcAgentStats}
        topAgentName={computedTopAgent}
        onToast={showToast}
      />

      {/* 3. Sub-buyers Filter Chips for Current Agent */}
      {selectedAgent !== 'ALL' && currentAgentObj && (
        <div className="p-4 rounded-xl bg-[#111827] border border-white/[0.07] card-shine">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Sub-Buyers under {selectedAgent}
              </span>
            </div>
            <button
              onClick={() => setIsSubBuyerModalOpen(true)}
              className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Sub-Buyer</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSubBuyer('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedSubBuyer === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white border border-white/[0.06]'
              }`}
            >
              All under {selectedAgent}
            </button>

            {currentSubBuyers.map((sub, idx) => {
              const subSales = sales.filter(
                s => s.agentName === selectedAgent && s.subBuyerName === sub
              );
              const isSubSelected = selectedSubBuyer === sub;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedSubBuyer(sub)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition hover:-translate-y-0.5 cursor-pointer ${
                    isSubSelected
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white border border-white/[0.06]'
                  }`}
                >
                  <span>{sub}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                      isSubSelected
                        ? 'bg-slate-950/20 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {subSales.length}
                  </span>
                </button>
              );
            })}

            {currentSubBuyers.length === 0 && (
              <span className="text-xs text-slate-500 py-1 italic">
                No sub-buyers yet. Click &quot;+ Add Sub-Buyer&quot; to register clients under {selectedAgent}.
              </span>
            )}
          </div>
        </div>
      )}

      {/* 4. Main Split: Record Lorry Dispatch Form + Dispatched Loads Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Record Lorry Dispatch Form */}
        <div className="rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 mb-4">
            <Truck className="w-4 h-4 text-amber-400" />
            <span>Record Lorry Dispatch</span>
          </h3>

          <form onSubmit={handleAddSale} className="space-y-3.5 text-xs">
            {/* Quarry Agent Dropdown - Active Agents Only */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400 font-medium">Quarry Agent</label>
                <button
                  type="button"
                  onClick={handleOpenAddAgent}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                >
                  + New Agent
                </button>
              </div>
              <select
                value={newSale.agentName}
                onChange={(e) => {
                  const ag = e.target.value;
                  const targetAg = activeAgents.find(a => a.name === ag);
                  const firstSub = targetAg?.subBuyers?.[0] || 'Direct / Unassigned';
                  setNewSale({ ...newSale, agentName: ag, subBuyerName: firstSub });
                }}
                className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                {activeAgents.length > 0 ? (
                  activeAgents.map(a => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))
                ) : (
                  <option value="">No Active Agents Available</option>
                )}
              </select>
            </div>

            {/* Sub-Buyer Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400 font-medium">Sub-Buyer</label>
                {newSale.agentName && (
                  <button
                    type="button"
                    onClick={() => setIsSubBuyerModalOpen(true)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    + Add Sub-Buyer
                  </button>
                )}
              </div>
              <select
                value={newSale.subBuyerName}
                onChange={(e) => setNewSale({ ...newSale, subBuyerName: e.target.value })}
                className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                {((activeAgents.find(a => a.name === newSale.agentName)?.subBuyers) || []).length > 0 ? (
                  (activeAgents.find(a => a.name === newSale.agentName)?.subBuyers || []).map((sub, i) => (
                    <option key={i} value={sub}>{sub}</option>
                  ))
                ) : (
                  <option value="Direct / Unassigned">Direct / Unassigned</option>
                )}
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Stone / Material</label>
              <select
                value={newSale.material}
                onChange={(e) => setNewSale({ ...newSale, material: e.target.value })}
                className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                <option>20mm Jalli (Blue Metal)</option>
                <option>40mm Jalli</option>
                <option>M-Sand (Manufactured Sand)</option>
                <option>P-Sand (Plastering Sand)</option>
                <option>Rough Stone / Boulders</option>
                <option>GSB / Gravel Mix</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Units (Units/Brass)</label>
                <input
                  type="number"
                  min="1"
                  value={newSale.units}
                  onChange={(e) => setNewSale({ ...newSale, units: e.target.value })}
                  className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 tabular-nums"
                />
              </div>
              <div>
                <label className="text-slate-400 font-medium block mb-1">Passes Used</label>
                <input
                  type="number"
                  min="0"
                  value={newSale.passesUsed}
                  onChange={(e) => setNewSale({ ...newSale, passesUsed: e.target.value })}
                  className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 tabular-nums"
                />
              </div>
            </div>

            {/* Govt Transit Pass Batch Link Info / Alert */}
            {requestedPasses > 0 && isNoPassesAvailable ? (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <div className="font-semibold">No valid passes available.</div>
                  <div className="text-[11px] text-rose-400/80">Procure a new batch. Expired passes cannot be dispatched.</div>
                </div>
              </div>
            ) : requestedPasses > 0 && isPassInsufficient ? (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Cannot dispatch: only {validPassCount} valid {validPassCount === 1 ? 'pass' : 'passes'} available in stock.</span>
              </div>
            ) : requestedPasses > 0 && nextBatch ? (
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-amber-500/20 text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileCheck2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-slate-400 text-[11px]">Pass from:</span>
                  <span className="font-semibold text-amber-300 font-mono text-[11px] truncate">
                    {nextBatch.batchNo}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-300 tabular-nums shrink-0 ml-2">
                  {nextBatch.daysLeft <= 0 ? 'expires today' : `expires in ${nextBatch.daysLeft} days`}
                </span>
              </div>
            ) : null}

            <div>
              <label className="text-slate-400 font-medium block mb-1">Lorry Reg. Number</label>
              <input
                type="text"
                placeholder="e.g. TN 45 BX 8891"
                value={newSale.lorryNo}
                onChange={(e) => setNewSale({ ...newSale, lorryNo: e.target.value.toUpperCase() })}
                className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400 uppercase"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Total Bill (₹)</label>
              <input
                type="number"
                placeholder="e.g. 21000"
                value={newSale.amount}
                onChange={(e) => setNewSale({ ...newSale, amount: e.target.value })}
                className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-white font-bold tabular-nums placeholder-slate-600 focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={
                activeAgents.length === 0 ||
                (requestedPasses > 0 && isPassInsufficient) ||
                (requestedPasses > 0 && isNoPassesAvailable)
              }
              className={`w-full mt-2 py-2.5 rounded-lg text-slate-950 font-bold transition flex items-center justify-center gap-1.5 shadow-md ${
                activeAgents.length > 0 && !isPassInsufficient && !(requestedPasses > 0 && isNoPassesAvailable)
                  ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/10 cursor-pointer'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Record Dispatch</span>
            </button>
          </form>
        </div>

        {/* Filtered Sales Table */}
        <div className="lg:col-span-2 rounded-xl p-5 sm:p-6 bg-[#111827] border border-white/[0.07] card-shine">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.06] mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                Dispatched Loads: {selectedAgent} ({selectedSubBuyer})
              </h3>
              <p className="text-xs text-slate-400">
                {filteredSales.length === 1 ? '1 load record' : `${filteredSales.length} load records`}
              </p>
            </div>

            {/* Search in sales */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filter lorry or material..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 text-xs text-white pl-8 pr-3 py-1.5 rounded-lg border border-white/[0.08] placeholder-slate-500 focus:outline-none focus:border-amber-400 w-48 sm:w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.05]">
                  <th className="pb-3 px-3">Date & ID</th>
                  <th className="pb-3 px-3">Buyer</th>
                  <th className="pb-3 px-3">Material</th>
                  <th className="pb-3 px-3">Lorry No</th>
                  <th className="pb-3 px-3">Pass</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredSales.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-3 text-slate-400 tabular-nums">
                      <div className="font-semibold text-slate-300">{formatDate(s.date)}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{s.id}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-white">{s.subBuyerName}</span>
                      <span className="text-slate-400 block text-[10px]">under {s.agentName}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {s.material}
                      <span className="text-slate-400 block text-[10px]">
                        {s.units} {s.units === 1 ? 'Unit' : 'Units'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-amber-300">
                      {s.lorryNo}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        -{s.passesUsed}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400 tabular-nums">
                      ₹{Number(s.amount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredSales.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-500">
                No dispatch records match the selected filter.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agent Modal (Slide-in / Centered Modal) */}
      <AgentModal
        isOpen={isAgentModalOpen}
        onClose={() => {
          setIsAgentModalOpen(false);
          setEditingAgent(null);
        }}
        onSave={handleSaveAgentData}
        initialAgent={editingAgent}
        existingAgents={agents}
      />

      {/* Sub-Buyer Modal */}
      <SubBuyerModal
        isOpen={isSubBuyerModalOpen}
        onClose={() => setIsSubBuyerModalOpen(false)}
        onSave={handleSaveSubBuyerData}
        agents={activeAgents}
        defaultAgentName={selectedAgent !== 'ALL' ? selectedAgent : activeAgents[0]?.name}
      />

      {/* Confirm Delete / Deactivate Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmVariant={confirmDialog.confirmVariant}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </motion.div>
  );
}
