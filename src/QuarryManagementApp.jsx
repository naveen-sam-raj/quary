import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  FileCheck2,
  Users,
  ChevronRight,
  ChevronDown,
  Truck,
  Plus,
  Database,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Trash2,
  Building2,
  Fuel,
  Utensils,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  Code2,
  X
} from 'lucide-react';

const INITIAL_AGENTS = [
  {
    id: 'agent-1',
    name: 'Naveen',
    phone: '+91 98765 43210',
    subBuyers: ['Sam', 'Raj', 'Kumar', 'Bala']
  },
  {
    id: 'agent-2',
    name: 'Karthik',
    phone: '+91 94432 11223',
    subBuyers: ['Mani', 'Surya', 'Vignesh']
  },
  {
    id: 'agent-3',
    name: 'Murugan Agencies',
    phone: '+91 98421 55667',
    subBuyers: ['Senthil', 'Prabhu']
  }
];

const INITIAL_SALES = [
  { id: 'S-101', date: '2026-10-15', agentName: 'Naveen', subBuyerName: 'Sam', material: '20mm Jalli (Blue Metal)', units: 4, lorryNo: 'TN 45 BX 8891', passesUsed: 1, amount: 18000, status: 'Paid' },
  { id: 'S-102', date: '2026-10-15', agentName: 'Naveen', subBuyerName: 'Raj', material: 'M-Sand (Manufactured Sand)', units: 6, lorryNo: 'TN 38 CY 4412', passesUsed: 2, amount: 31500, status: 'Paid' },
  { id: 'S-103', date: '2026-10-16', agentName: 'Naveen', subBuyerName: 'Sam', material: 'P-Sand (Plastering Sand)', units: 3, lorryNo: 'TN 45 BX 8891', passesUsed: 1, amount: 16500, status: 'Pending' },
  { id: 'S-104', date: '2026-10-16', agentName: 'Naveen', subBuyerName: 'Kumar', material: '40mm Jalli', units: 5, lorryNo: 'TN 72 AZ 9901', passesUsed: 1, amount: 21000, status: 'Paid' },
  { id: 'S-105', date: '2026-10-17', agentName: 'Naveen', subBuyerName: 'Raj', material: 'Rough Stone / Boulders', units: 8, lorryNo: 'TN 38 CY 4412', passesUsed: 2, amount: 28000, status: 'Paid' },
  { id: 'S-106', date: '2026-10-17', agentName: 'Karthik', subBuyerName: 'Mani', material: '20mm Jalli (Blue Metal)', units: 5, lorryNo: 'TN 22 DK 1102', passesUsed: 1, amount: 22500, status: 'Paid' },
  { id: 'S-107', date: '2026-10-18', agentName: 'Karthik', subBuyerName: 'Surya', material: 'GSB / Gravel Mix', units: 6, lorryNo: 'TN 22 DK 5541', passesUsed: 2, amount: 19200, status: 'Pending' },
  { id: 'S-108', date: '2026-10-18', agentName: 'Murugan Agencies', subBuyerName: 'Senthil', material: 'M-Sand (Manufactured Sand)', units: 4, lorryNo: 'TN 59 AL 3309', passesUsed: 1, amount: 21000, status: 'Paid' },
];

const INITIAL_PURCHASES = [
  { id: 'P-201', date: '2026-10-14', category: 'JCB Rent', vendor: 'velavan Earthmovers', description: 'JCB 3DX 2 Days Loading Work', amount: 18500, paymentMode: 'UPI / GPay' },
  { id: 'P-202', date: '2026-10-15', category: 'Food Rent (Mess & Tea)', vendor: 'Annalakshmi Mess', description: 'Workers & Drivers Weekly Food + Tea', amount: 8400, paymentMode: 'Cash' },
  { id: 'P-203', date: '2026-10-16', category: 'Hitachi / Excavator Rent', vendor: 'Sri Sastha Heavy Equipments', description: 'Hitachi EX200 Breaker & Quarry Pit Work', amount: 34000, paymentMode: 'Bank Transfer' },
  { id: 'P-204', date: '2026-10-17', category: 'Tipper & Machinery Diesel', vendor: 'IndianOil Bunks', description: '400 Litres Diesel for Crusher & Tipper', amount: 37600, paymentMode: 'Bank Transfer' },
  { id: 'P-205', date: '2026-10-18', category: 'Explosives / Blasting', vendor: 'Licensed Quarry Blasters', description: 'Drilling & Compressor Blasting Charges', amount: 22000, paymentMode: 'Cash' },
];

const INITIAL_PASS_BATCHES = [
  { id: 'GP-01', date: '2026-10-01', batchNo: 'TN-GEO-2026-881', passesBought: 50, costPerPass: 350, totalCost: 17500, authority: 'Dept of Geology & Mining' },
  { id: 'GP-02', date: '2026-10-12', batchNo: 'TN-GEO-2026-942', passesBought: 30, costPerPass: 350, totalCost: 10500, authority: 'Dept of Geology & Mining' },
];

export default function QuarryManagementApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [sales, setSales] = useState(INITIAL_SALES);
  const [purchases, setPurchases] = useState(INITIAL_PURCHASES);
  const [passBatches, setPassBatches] = useState(INITIAL_PASS_BATCHES);
  const [showSchemaModal, setShowSchemaModal] = useState(false);

  // Sales Tree Selection State (Default expanded: Naveen)
  const [selectedAgent, setSelectedAgent] = useState('Naveen');
  const [selectedSubBuyer, setSelectedSubBuyer] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // New Sale Form State
  const [newSale, setNewSale] = useState({
    agentName: 'Naveen',
    subBuyerName: 'Sam',
    material: '20mm Jalli (Blue Metal)',
    units: 4,
    lorryNo: '',
    passesUsed: 1,
    amount: '',
    status: 'Paid'
  });

  // New SubBuyer Form under Agent
  const [newSubBuyerInput, setNewSubBuyerInput] = useState('');

  // New Purchase Form State
  const [newPurchase, setNewPurchase] = useState({
    category: 'JCB Rent',
    vendor: '',
    description: '',
    amount: '',
    paymentMode: 'Cash'
  });

  // New Govt Pass Batch State
  const [newPassBatch, setNewPassBatch] = useState({
    batchNo: '',
    passesBought: '',
    costPerPass: 350
  });

  // Computed Summary Metrics for Dashboard
  const stats = useMemo(() => {
    const totalSalesAmount = sales.reduce((acc, s) => acc + Number(s.amount || 0), 0);
    const totalPurchaseAmount = purchases.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const totalPassCost = passBatches.reduce((acc, b) => acc + Number(b.totalCost || 0), 0);
    const totalExpenses = totalPurchaseAmount + totalPassCost;
    const netProfit = totalSalesAmount - totalExpenses;

    const totalPassesBought = passBatches.reduce((acc, b) => acc + Number(b.passesBought || 0), 0);
    const totalPassesUsed = sales.reduce((acc, s) => acc + Number(s.passesUsed || 0), 0);
    const remainingPasses = totalPassesBought - totalPassesUsed;

    return {
      totalSalesAmount,
      totalPurchaseAmount,
      totalPassCost,
      totalExpenses,
      netProfit,
      totalPassesBought,
      totalPassesUsed,
      remainingPasses
    };
  }, [sales, purchases, passBatches]);

  // Filtered Sales for Selected Agent & Sub-Buyer (e.g. Naveen -> Sam, Raj)
  const filteredSales = useMemo(() => {
    return sales.filter(item => {
      const matchAgent = selectedAgent === 'ALL' || item.agentName === selectedAgent;
      const matchSub = selectedSubBuyer === 'ALL' || item.subBuyerName === selectedSubBuyer;
      const matchSearch =
        item.subBuyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lorryNo.toLowerCase().includes(searchQuery.toLowerCase());
      return matchAgent && matchSub && matchSearch;
    });
  }, [sales, selectedAgent, selectedSubBuyer, searchQuery]);

  // Handlers
  const handleAddSale = (e) => {
    e.preventDefault();
    if (!newSale.amount || !newSale.lorryNo) return;
    const entry = {
      id: `S-${100 + sales.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      ...newSale,
      units: Number(newSale.units),
      passesUsed: Number(newSale.passesUsed),
      amount: Number(newSale.amount)
    };
    setSales([entry, ...sales]);
    setNewSale({ ...newSale, lorryNo: '', amount: '' });
  };

  const handleAddSubBuyer = (agentName) => {
    if (!newSubBuyerInput.trim()) return;
    setAgents(agents.map(ag => {
      if (ag.name === agentName && !ag.subBuyers.includes(newSubBuyerInput.trim())) {
        return { ...ag, subBuyers: [...ag.subBuyers, newSubBuyerInput.trim()] };
      }
      return ag;
    }));
    setNewSubBuyerInput('');
  };

  const handleAddPurchase = (e) => {
    e.preventDefault();
    if (!newPurchase.amount || !newPurchase.vendor) return;
    const entry = {
      id: `P-${200 + purchases.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      ...newPurchase,
      amount: Number(newPurchase.amount)
    };
    setPurchases([entry, ...purchases]);
    setNewPurchase({ ...newPurchase, vendor: '', description: '', amount: '' });
  };

  const handleAddPassBatch = (e) => {
    e.preventDefault();
    if (!newPassBatch.passesBought || !newPassBatch.batchNo) return;
    const bought = Number(newPassBatch.passesBought);
    const cost = Number(newPassBatch.costPerPass);
    const entry = {
      id: `GP-0${passBatches.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      batchNo: newPassBatch.batchNo,
      passesBought: bought,
      costPerPass: cost,
      totalCost: bought * cost,
      authority: 'Dept of Geology & Mining'
    };
    setPassBatches([entry, ...passBatches]);
    setNewPassBatch({ batchNo: '', passesBought: '', costPerPass: 350 });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">ROCKSTONE QUARRY ERP</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                  MERN Frontend Mockup
                </span>
              </div>
              <p className="text-xs text-slate-400">Sales (Agent Hierarchy) • JCB & Food Purchases • Govt Pass Live Tracker</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Main Dashboard
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'sales'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              1. Sales (Naveen / Buyers)
            </button>
            <button
              onClick={() => setActiveTab('purchase')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'purchase'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              2. Purchase (JCB / Food)
            </button>
            <button
              onClick={() => setActiveTab('pass')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'pass'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              3. Govt Pass Tracker
            </button>
          </div>

          <button
            onClick={() => setShowSchemaModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
          >
            <Code2 className="w-4 h-4 text-amber-400" />
            MERN Schema Info
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* TOP KPI SUMMARY CARDS (Always visible or prominent on Dashboard) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Sales */}
          <div
            onClick={() => setActiveTab('sales')}
            className="cursor-pointer bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Quarry Sales</span>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">₹{stats.totalSalesAmount.toLocaleString('en-IN')}</span>
              <span className="text-xs text-emerald-400">({sales.length} Loads)</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 group-hover:text-emerald-300 transition">
              Includes Naveen (Sam, Raj, Kumar) & other agents →
            </p>
          </div>

          {/* Card 2: Total Purchases (JCB, Food, Diesel) */}
          <div
            onClick={() => setActiveTab('purchase')}
            className="cursor-pointer bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 rounded-2xl p-5 transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quarry Purchases & Rent</span>
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ArrowDownRight className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">₹{stats.totalPurchaseAmount.toLocaleString('en-IN')}</span>
              <span className="text-xs text-rose-400">+₹{stats.totalPassCost.toLocaleString('en-IN')} Pass Cost</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 group-hover:text-rose-300 transition">
              JCB Rent, Food Rent, Diesel & Blasting →
            </p>
          </div>

          {/* Card 3: Remaining Government Passes */}
          <div
            onClick={() => setActiveTab('pass')}
            className="cursor-pointer bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Govt Transit Passes</span>
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <FileCheck2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold text-amber-400">{stats.remainingPasses}</span>
                <span className="text-xs text-slate-400 ml-1.5">Remaining</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Used: {stats.totalPassesUsed} / {stats.totalPassesBought}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full"
                style={{ width: `${Math.min(100, Math.round((stats.remainingPasses / (stats.totalPassesBought || 1)) * 100))}%` }}
              />
            </div>
          </div>

          {/* Card 4: Net Profit Balance */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border border-indigo-500/30 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Net Quarry Balance</span>
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{stats.netProfit.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Sales (₹{stats.totalSalesAmount.toLocaleString('en-IN')}) - Total Outflow (₹{stats.totalExpenses.toLocaleString('en-IN')})
            </p>
          </div>
        </div>

        {/* ==========================================================
            TAB 0: MAIN DASHBOARD OVERVIEW
        ========================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Agent Wise Breakdown (Highlighting Naveen -> Sam, Raj, etc.) */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-amber-400" />
                      Agent & Sub-Buyer Sales Summary (Naveen → Sam, Raj...)
                    </h2>
                    <p className="text-xs text-slate-400">Click any agent to inspect individual loads in the Sales Tab</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('sales')}
                    className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg transition"
                  >
                    Open Full Sales View →
                  </button>
                </div>

                <div className="space-y-4">
                  {agents.map(agent => {
                    const agentSales = sales.filter(s => s.agentName === agent.name);
                    const agentTotal = agentSales.reduce((acc, s) => acc + s.amount, 0);
                    const agentPasses = agentSales.reduce((acc, s) => acc + s.passesUsed, 0);

                    return (
                      <div key={agent.id} className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center">
                              {agent.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{agent.name} <span className="text-xs text-slate-400 font-normal">({agent.phone})</span></h3>
                              <p className="text-xs text-slate-400">Sub-Buyers: {agent.subBuyers.join(', ')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-bold text-emerald-400">₹{agentTotal.toLocaleString('en-IN')}</span>
                            <span className="block text-xs text-slate-400">{agentSales.length} Loads • {agentPasses} Govt Passes</span>
                          </div>
                        </div>

                        {/* Sub-buyers pills */}
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {agent.subBuyers.map(sub => {
                            const subSales = agentSales.filter(s => s.subBuyerName === sub);
                            const subTotal = subSales.reduce((acc, s) => acc + s.amount, 0);
                            return (
                              <button
                                key={sub}
                                onClick={() => {
                                  setSelectedAgent(agent.name);
                                  setSelectedSubBuyer(sub);
                                  setActiveTab('sales');
                                }}
                                className="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 transition flex flex-col justify-between"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-slate-200">{sub}</span>
                                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">{subSales.length} loads</span>
                                </div>
                                <span className="text-sm font-bold text-white mt-1">₹{subTotal.toLocaleString('en-IN')}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Purchase & Expense Split + Pass Meter */}
              <div className="space-y-6">
                {/* Expense Breakdown */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-rose-400" />
                      Purchase & Rent Breakdown
                    </h2>
                    <button
                      onClick={() => setActiveTab('purchase')}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      Manage →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {purchases.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                        <div>
                          <span className="text-xs font-semibold text-rose-300 block">{p.category}</span>
                          <span className="text-xs text-slate-400">{p.vendor} • {p.date}</span>
                        </div>
                        <span className="text-sm font-bold text-white">₹{p.amount.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Government Pass Live Status Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-400" />
                      Government Pass Stock
                    </h2>
                    <button
                      onClick={() => setActiveTab('pass')}
                      className="text-xs text-amber-400 hover:underline"
                    >
                      Add Stock →
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Total Passes Received (Govt):</span>
                      <span className="font-bold text-white">{stats.totalPassesBought} Passes</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Used in Lorry Sales:</span>
                      <span className="font-bold text-rose-400">-{stats.totalPassesUsed} Passes</span>
                    </div>
                    <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
                      <span className="text-xs font-semibold text-amber-300">Available Remaining Passes:</span>
                      <span className="text-xl font-extrabold text-amber-400">{stats.remainingPasses}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================================
            TAB 1: SALES MODULE (NAVEEN -> SAM, RAJ HIERARCHY)
        ========================================================== */}
        {activeTab === 'sales' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar: Agent & Sub-Buyer Hierarchy Tree */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-amber-400" />
                  Select Agent & Sub-Buyer
                </h2>
                <p className="text-xs text-slate-400 mb-4">
                  Click on <strong className="text-amber-300">Naveen</strong> to see all sub-buyers (<strong className="text-amber-300">Sam, Raj, Kumar</strong>) and what they purchased from the quarry.
                </p>

                <button
                  onClick={() => {
                    setSelectedAgent('ALL');
                    setSelectedSubBuyer('ALL');
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold mb-3 border transition flex items-center justify-between ${
                    selectedAgent === 'ALL'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>All Quarry Agents & Buyers</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">{sales.length} Loads</span>
                </button>

                {/* Agent Tree List */}
                <div className="space-y-3">
                  {agents.map(agent => {
                    const isAgentSelected = selectedAgent === agent.name;
                    const agentSales = sales.filter(s => s.agentName === agent.name);
                    const agentTotal = agentSales.reduce((acc, s) => acc + s.amount, 0);

                    return (
                      <div
                        key={agent.id}
                        className={`rounded-xl border transition overflow-hidden ${
                          isAgentSelected ? 'border-amber-500/60 bg-slate-950' : 'border-slate-800 bg-slate-950/50'
                        }`}
                      >
                        {/* Main Agent Row (e.g. Naveen) */}
                        <div
                          onClick={() => {
                            setSelectedAgent(agent.name);
                            setSelectedSubBuyer('ALL');
                            setNewSale(prev => ({ ...prev, agentName: agent.name, subBuyerName: agent.subBuyers[0] || '' }));
                          }}
                          className="p-3.5 cursor-pointer flex items-center justify-between hover:bg-slate-900 transition"
                        >
                          <div className="flex items-center gap-2.5">
                            {isAgentSelected ? (
                              <ChevronDown className="w-4 h-4 text-amber-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            )}
                            <div>
                              <span className="font-bold text-sm text-white block">{agent.name}</span>
                              <span className="text-[11px] text-slate-400">{agent.subBuyers.length} Sub-Buyers under {agent.name}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-emerald-400 block">₹{agentTotal.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-slate-400">{agentSales.length} loads</span>
                          </div>
                        </div>

                        {/* Sub-Buyers List (Sam, Raj, Kumar under Naveen) */}
                        {isAgentSelected && (
                          <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-800/80 space-y-1.5 bg-slate-900/40">
                            <button
                              onClick={() => setSelectedSubBuyer('ALL')}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                                selectedSubBuyer === 'ALL'
                                  ? 'bg-amber-500 text-slate-950 font-bold'
                                  : 'text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <span>All under {agent.name}</span>
                              <span>{agentSales.length} loads</span>
                            </button>

                            {agent.subBuyers.map(subName => {
                              const subOrders = agentSales.filter(s => s.subBuyerName === subName);
                              const subAmt = subOrders.reduce((a, b) => a + b.amount, 0);
                              return (
                                <button
                                  key={subName}
                                  onClick={() => {
                                    setSelectedSubBuyer(subName);
                                    setNewSale(prev => ({ ...prev, agentName: agent.name, subBuyerName: subName }));
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                                    selectedSubBuyer === subName
                                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                                      : 'text-slate-300 hover:bg-slate-800/70'
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    {subName}
                                  </span>
                                  <span>₹{subAmt.toLocaleString('en-IN')} ({subOrders.length})</span>
                                </button>
                              );
                            })}

                            {/* Add a new Sub-Buyer under this Agent */}
                            <div className="pt-2 flex gap-1.5">
                              <input
                                type="text"
                                placeholder={`+ Add person under ${agent.name}...`}
                                value={newSubBuyerInput}
                                onChange={e => setNewSubBuyerInput(e.target.value)}
                                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddSubBuyer(agent.name)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-xs font-semibold rounded-lg transition"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add New Quarry Sale Form */}
              <form onSubmit={handleAddSale} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  New Quarry Load Entry (Sales)
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Main Agent (e.g. Naveen)</label>
                    <select
                      value={newSale.agentName}
                      onChange={e => {
                        const ag = agents.find(a => a.name === e.target.value);
                        setNewSale({
                          ...newSale,
                          agentName: e.target.value,
                          subBuyerName: ag?.subBuyers[0] || ''
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      {agents.map(a => (
                        <option key={a.id} value={a.name}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Sub-Buyer (Sam, Raj...)</label>
                    <select
                      value={newSale.subBuyerName}
                      onChange={e => setNewSale({ ...newSale, subBuyerName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      {(agents.find(a => a.name === newSale.agentName)?.subBuyers || []).map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Quarry Material</label>
                  <select
                    value={newSale.material}
                    onChange={e => setNewSale({ ...newSale, material: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option>20mm Jalli (Blue Metal)</option>
                    <option>40mm Jalli</option>
                    <option>12mm Jalli</option>
                    <option>M-Sand (Manufactured Sand)</option>
                    <option>P-Sand (Plastering Sand)</option>
                    <option>Rough Stone / Boulders</option>
                    <option>GSB / Gravel Mix</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Units</label>
                    <input
                      type="number"
                      min="1"
                      value={newSale.units}
                      onChange={e => setNewSale({ ...newSale, units: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Govt Passes</label>
                    <input
                      type="number"
                      min="1"
                      value={newSale.passesUsed}
                      onChange={e => setNewSale({ ...newSale, passesUsed: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-amber-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="18000"
                      required
                      value={newSale.amount}
                      onChange={e => setNewSale({ ...newSale, amount: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-emerald-400 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Lorry / Tipper Number</label>
                    <input
                      type="text"
                      placeholder="TN 45 BX 8891"
                      required
                      value={newSale.lorryNo}
                      onChange={e => setNewSale({ ...newSale, lorryNo: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Payment Status</label>
                    <select
                      value={newSale.status}
                      onChange={e => setNewSale({ ...newSale, status: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Credit / Pending</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition"
                >
                  + Save Load & Deduct Govt Pass
                </button>
              </form>
            </div>

            {/* Right Column: Filtered Sales Ledger Table */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">
                      {selectedAgent === 'ALL' ? 'All Quarry Sales' : `Agent: ${selectedAgent}`}
                    </h2>
                    {selectedSubBuyer !== 'ALL' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                        Sub-Buyer: {selectedSubBuyer}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Showing {filteredSales.length} load dispatches • Total Value:{' '}
                    <strong className="text-emerald-400">
                      ₹{filteredSales.reduce((a, b) => a + b.amount, 0).toLocaleString('en-IN')}
                    </strong>
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search material, buyer, lorry..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Sub-buyer quick filter pills when an Agent like Naveen is active */}
              {selectedAgent !== 'ALL' && (
                <div className="flex items-center gap-2 py-3 overflow-x-auto border-b border-slate-800/60">
                  <span className="text-xs text-slate-400 mr-1">Filter {selectedAgent}'s Buyers:</span>
                  <button
                    onClick={() => setSelectedSubBuyer('ALL')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      selectedSubBuyer === 'ALL'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-300 border border-slate-800'
                    }`}
                  >
                    All ({sales.filter(s => s.agentName === selectedAgent).length})
                  </button>
                  {(agents.find(a => a.name === selectedAgent)?.subBuyers || []).map(sub => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubBuyer(sub)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                        selectedSubBuyer === sub
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {sub} ({sales.filter(s => s.agentName === selectedAgent && s.subBuyerName === sub).length})
                    </button>
                  ))}
                </div>
              )}

              {/* Sales Table */}
              <div className="overflow-x-auto mt-4 flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-3">Date & ID</th>
                      <th className="py-3 px-3">Main Agent</th>
                      <th className="py-3 px-3">Sub-Buyer</th>
                      <th className="py-3 px-3">Material & Units</th>
                      <th className="py-3 px-3">Lorry & Pass</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-xs">
                    {filteredSales.map(item => (
                      <tr key={item.id} className="hover:bg-slate-950/60 transition">
                        <td className="py-3.5 px-3">
                          <span className="font-semibold text-slate-200 block">{item.id}</span>
                          <span className="text-[11px] text-slate-500">{item.date}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2.5 py-1 rounded-md bg-slate-800 text-amber-300 font-medium">
                            {item.agentName}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-bold text-white">{item.subBuyerName}</td>
                        <td className="py-3.5 px-3">
                          <span className="text-slate-200 font-medium block">{item.material}</span>
                          <span className="text-[11px] text-slate-400">{item.units} Units Load</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="text-slate-200 font-mono text-[11px] flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-slate-400" />
                            {item.lorryNo}
                          </span>
                          <span className="text-[11px] text-amber-400">Pass Used: {item.passesUsed}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              item.status === 'Paid'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-emerald-400 text-sm">
                          ₹{item.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================================
            TAB 2: PURCHASE & QUARRY EXPENSES (JCB RENT, FOOD RENT, ETC.)
        ========================================================== */}
        {activeTab === 'purchase' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Add Expense Form */}
            <div className="lg:col-span-4">
              <form onSubmit={handleAddPurchase} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-rose-400" />
                    Add Quarry Purchase / Rent
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Record JCB rent, daily worker food/mess rent, diesel, and quarry maintenance.
                  </p>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Expense / Rent Category</label>
                  <select
                    value={newPurchase.category}
                    onChange={e => setNewPurchase({ ...newPurchase, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option>JCB Rent</option>
                    <option>Food Rent (Mess & Tea)</option>
                    <option>Hitachi / Excavator Rent</option>
                    <option>Tipper & Machinery Diesel</option>
                    <option>Explosives / Blasting</option>
                    <option>Crusher Spare Parts & Maintenance</option>
                    <option>Quarry Labour Beta / Wages</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Vendor / Machine Owner Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Velavan JCB / Annalakshmi Mess"
                    required
                    value={newPurchase.vendor}
                    onChange={e => setNewPurchase({ ...newPurchase, vendor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Work / Purchase Details</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 Days JCB Loading / Weekly Staff Food"
                    required
                    value={newPurchase.description}
                    onChange={e => setNewPurchase({ ...newPurchase, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="15000"
                      required
                      value={newPurchase.amount}
                      onChange={e => setNewPurchase({ ...newPurchase, amount: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-rose-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Payment Mode</label>
                    <select
                      value={newPurchase.paymentMode}
                      onChange={e => setNewPurchase({ ...newPurchase, paymentMode: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                    >
                      <option>Cash</option>
                      <option>UPI / GPay</option>
                      <option>Bank Transfer</option>
                      <option>Pending Credit</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20 transition"
                >
                  + Add Purchase Expense to Dashboard
                </button>
              </form>
            </div>

            {/* Purchase List & Category Summary */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Quarry Purchases & Operational Expenses</h2>
                  <p className="text-xs text-slate-400">Tracks JCB Rent, Food Rent, Diesel, Hitachi, and Blasting</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Purchase Outflow</span>
                  <span className="text-xl font-bold text-rose-400">₹{stats.totalPurchaseAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-3">Date & ID</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Vendor & Details</th>
                      <th className="py-3 px-3">Mode</th>
                      <th className="py-3 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-xs">
                    {purchases.map(p => (
                      <tr key={p.id} className="hover:bg-slate-950/60 transition">
                        <td className="py-3.5 px-3">
                          <span className="font-semibold text-slate-200 block">{p.id}</span>
                          <span className="text-[11px] text-slate-500">{p.date}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-white block">{p.vendor}</span>
                          <span className="text-[11px] text-slate-400">{p.description}</span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-300">{p.paymentMode}</td>
                        <td className="py-3.5 px-3 text-right font-bold text-rose-400 text-sm">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================================
            TAB 3: GOVERNMENT PASS TRACKER
        ========================================================== */}
        {activeTab === 'pass' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Add New Govt Pass Batch */}
            <div className="lg:col-span-4 space-y-4">
              <form onSubmit={handleAddPassBatch} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-amber-400" />
                    Add Government Transit Pass Batch
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter bulk transit passes purchased from the Department of Geology & Mining.
                  </p>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Govt Permit / Batch Number</label>
                  <input
                    type="text"
                    placeholder="e.g. TN-GEO-2026-995"
                    required
                    value={newPassBatch.batchNo}
                    onChange={e => setNewPassBatch({ ...newPassBatch, batchNo: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Total Passes Bought</label>
                    <input
                      type="number"
                      placeholder="50"
                      required
                      value={newPassBatch.passesBought}
                      onChange={e => setNewPassBatch({ ...newPassBatch, passesBought: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-amber-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Fee per Pass (₹)</label>
                    <input
                      type="number"
                      value={newPassBatch.costPerPass}
                      onChange={e => setNewPassBatch({ ...newPassBatch, costPerPass: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition"
                >
                  + Add Passes to Quarry Stock
                </button>
              </form>

              {/* Pass Usage Formula Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">How Pass Tracking Works</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  1. Whenever you buy a Pass Book/Batch from the Government, add it here.<br />
                  2. Every time a lorry load is billed under <strong>Sales (Naveen, Karthik, etc.)</strong>, the passes used are automatically deducted from your Remaining Pass balance.
                </p>
              </div>
            </div>

            {/* Right: Govt Pass Inventory & Usage Log */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Government Pass Batches Purchased</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Govt Batch No</th>
                        <th className="py-3 px-3">Authority</th>
                        <th className="py-3 px-3">Passes Count</th>
                        <th className="py-3 px-3 text-right">Govt Fee Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 text-xs">
                      {passBatches.map(b => (
                        <tr key={b.id}>
                          <td className="py-3.5 px-3 text-slate-300">{b.date}</td>
                          <td className="py-3.5 px-3 font-mono font-bold text-amber-300">{b.batchNo}</td>
                          <td className="py-3.5 px-3 text-slate-400">{b.authority}</td>
                          <td className="py-3.5 px-3 font-bold text-white">+{b.passesBought} Passes</td>
                          <td className="py-3.5 px-3 text-right font-bold text-rose-400">₹{b.totalCost.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pass Deduction History from Sales */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-3">Recent Pass Usage by Lorries (Auto-Synced from Sales)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sales.slice(0, 6).map(s => (
                    <div key={s.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white">{s.lorryNo}</span>
                        <span className="text-[11px] text-slate-400 block">
                          {s.agentName} → {s.subBuyerName} ({s.material})
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold">
                        -{s.passesUsed} Pass
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MERN Stack Database Architecture Modal */}
      {showSchemaModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-400" />
                MERN Stack MongoDB Schema Reference (For Future Backend)
              </h3>
              <button onClick={() => setShowSchemaModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl text-xs text-amber-300 overflow-x-auto font-mono leading-relaxed">
{`// 1. Agent & Sub-Buyer Collection (Naveen -> Sam, Raj)
const AgentSchema = new mongoose.Schema({
  agentName: String,       // "Naveen"
  phone: String,
  subBuyers: [String]      // ["Sam", "Raj", "Kumar"]
});

// 2. Sales Collection
const SaleSchema = new mongoose.Schema({
  agentName: String,       // "Naveen"
  subBuyerName: String,    // "Sam"
  material: String,        // "20mm Jalli"
  units: Number,
  lorryNo: String,
  passesUsed: Number,      // Deducts from Govt Pass Stock
  amount: Number,
  date: Date
});

// 3. Purchase Collection (JCB Rent, Food Rent, Diesel)
const PurchaseSchema = new mongoose.Schema({
  category: String,        // "JCB Rent", "Food Rent"
  vendor: String,
  description: String,
  amount: Number,
  date: Date
});

// 4. GovtPass Collection
const GovtPassSchema = new mongoose.Schema({
  batchNo: String,
  passesBought: Number,
  totalCost: Number,
  date: Date
});`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
