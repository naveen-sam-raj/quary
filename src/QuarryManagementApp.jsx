import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GlobalSearchModal from './components/GlobalSearchModal';
import Toast from './components/ui/Toast';

import DashboardView from './components/tabs/DashboardView';
import SalesView from './components/tabs/SalesView';
import PurchasesView from './components/tabs/PurchasesView';
import PassesView from './components/tabs/PassesView';
import ReportsView from './components/tabs/ReportsView';

import { useAgents } from './hooks/useAgents';
import { useLoads } from './hooks/useLoads';
import { usePurchases } from './hooks/usePurchases';
import { usePasses } from './hooks/usePasses';
import { useTreasury } from './hooks/useTreasury';
import { useSettings } from './hooks/useSettings';

import {
  addDaysToDate,
  formatPassDate,
  getActivePassCount,
  getNextExpiry
} from './utils/passHelpers';



const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const [year, month, day] = parts;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
};

export default function QuarryManagementApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Dynamic Agents Management & Persistence Hook
  const {
    agents,
    subBuyers,
    addAgent,
    updateAgent,
    deleteAgent,
    toggleAgentStatus,
    addSubBuyer,
    getAgentStats,
    getTopAgent,
    isLoading: isLoadingAgents
  } = useAgents();

  // Core Data State
  const { loads: sales, addLoad, isLoading: isLoadingSales } = useLoads();
  const {
    purchases,
    addPurchase,
    updatePurchase,
    deletePurchase,
    isLoading: isLoadingPurchases
  } = usePurchases();

  // Settings API Hook
  const { settings: passSettings, updateSettings } = useSettings();

  // Govt Pass Batches API Hook
  const {
    passBatches,
    summary: passSummary,
    alerts: passAlerts,
    createBatch,
    returnBatch,
    isLoading: isLoadingPasses
  } = usePasses(passSettings?.warningDays || 7);

  // Sam Blue Metal Treasury API Hook
  const {
    treasuryLedger,
    treasuryStats,
    balance: treasuryBalance,
    withdrawPasses,
    isLoading: isLoadingTreasury
  } = useTreasury();

  // Toast Notification helper
  const showToast = useCallback((msg, type = 'success') => {
    const text = typeof msg === 'string' ? msg : msg?.message;
    const toastType = typeof msg === 'object' && msg?.type ? msg.type : type;
    setToast({ message: text, type: toastType });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const handleSavePassSettings = async (newSettings) => {
    try {
      await updateSettings(newSettings);
    } catch {
      // toast handled in hook
    }
  };

  // Withdraw Passes from Sam Blue Metal Treasury
  const handleWithdrawFromTreasury = async (count, note) => {
    try {
      await withdrawPasses(count, note);
    } catch {
      // toast handled in hook
    }
  };

  // Early Return to Treasury (Manual via ⋮ menu)
  const handleReturnToTreasuryManual = async (batchId, note) => {
    try {
      await returnBatch(batchId, note);
    } catch {
      // toast handled in hook
    }
  };

  // Sales Tree Selection State
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

  // New Purchase Form State
  const [newPurchase, setNewPurchase] = useState({
    category: 'JCB Rent',
    vendor: '',
    description: '',
    notes: '',
    amount: '',
    paymentMode: 'Cash'
  });

  // New Govt Pass Batch State with Issue Date, Validity, Valid Till
  const todayStr = new Date().toISOString().split('T')[0];
  const [newPassBatch, setNewPassBatch] = useState({
    batchNo: '',
    passesBought: '',
    costPerPass: 350,
    issueDate: todayStr,
    validityDays: passSettings?.defaultValidityDays || 30,
    validTill: addDaysToDate(todayStr, passSettings?.defaultValidityDays || 30),
    dueDate: addDaysToDate(todayStr, passSettings?.defaultValidityDays || 30)
  });

  // Computed Summary Metrics
  const stats = useMemo(() => {
    const totalSalesAmount = sales.reduce((acc, s) => acc + Number(s.amount || 0), 0);
    const totalPurchaseAmount = purchases.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const totalPassCost = passBatches.reduce((acc, b) => acc + Number(b.totalCost || 0), 0);
    const totalExpenses = totalPurchaseAmount + totalPassCost;
    const netProfit = totalSalesAmount - totalExpenses;

    // Total bought from Govt (from backend summary if available)
    const totalPassesBought =
      passSummary?.totalBoughtFromGovt !== undefined
        ? passSummary.totalBoughtFromGovt
        : passBatches
            .filter((b) => b.source !== 'treasury')
            .reduce((acc, b) => acc + Number(b.totalPasses !== undefined ? b.totalPasses : b.passesBought || 0), 0);

    // Total used by lorries (from backend summary if available)
    const totalPassesUsed =
      passSummary?.usedByLorries !== undefined
        ? passSummary.usedByLorries
        : passBatches.reduce((acc, b) => acc + Number(b.usedPasses || 0), 0);

    // Active remaining: valid govt passes + withdrawn treasury passes (from backend summary)
    const remainingPasses =
      passSummary?.activeRemaining !== undefined
        ? passSummary.activeRemaining
        : getActivePassCount(passBatches);

    const currentTreasuryBalance =
      treasuryBalance !== undefined ? treasuryBalance : (passSummary?.treasuryBalance || 0);

    return {
      totalSalesAmount,
      totalPurchaseAmount,
      totalPassCost,
      totalExpenses,
      netProfit,
      totalPassesBought,
      totalPassesUsed,
      remainingPasses,
      treasuryBalance: currentTreasuryBalance,
      treasuryStats,
      nextExpiry: passSummary?.nextExpiry,
      lowStock: passSummary?.lowStock
    };
  }, [sales, purchases, passBatches, passSummary, treasuryBalance, treasuryStats]);

  // Filtered Sales for selected agent & sub-buyer
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

  // Purchase Categories Breakdown for charts & widgets
  const purchaseCategoryStats = useMemo(() => {
    const map = {};
    purchases.forEach(p => {
      map[p.category] = (map[p.category] || 0) + Number(p.amount || 0);
    });
    return Object.entries(map).map(([category, total]) => ({
      category,
      total,
      percentage: stats.totalPurchaseAmount > 0 ? ((total / stats.totalPurchaseAmount) * 100).toFixed(1) : 0
    }));
  }, [purchases, stats.totalPurchaseAmount]);

  // Handlers
  const handleAddSale = async (e) => {
    e.preventDefault();
    if (!newSale.amount || !newSale.lorryNo) return;

    const targetAgent = agents.find((a) => a.name === newSale.agentName);
    if (!targetAgent) {
      showToast('Please select a valid agent', 'error');
      return;
    }

    const targetSubBuyer = subBuyers.find(
      (sb) =>
        sb.name === newSale.subBuyerName &&
        (sb.agentId === targetAgent.id || sb.agentId === targetAgent._id || sb.agentName === targetAgent.name)
    );

    try {
      await addLoad({
        agentId: targetAgent._id || targetAgent.id,
        subBuyerId: targetSubBuyer?._id || targetSubBuyer?.id,
        lorryNo: newSale.lorryNo,
        material: newSale.material,
        quantity: Number(newSale.units || 1),
        amount: Number(newSale.amount)
      });
      setNewSale({ ...newSale, lorryNo: '', amount: '' });
    } catch {
      // toast notification handled by mutation
    }
  };

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    if (!newPurchase.amount || !newPurchase.vendor) return;
    try {
      await addPurchase({
        date: newPurchase.date || new Date().toISOString().split('T')[0],
        category: newPurchase.category,
        vendor: newPurchase.vendor,
        description: newPurchase.description,
        notes: newPurchase.notes,
        amount: Number(newPurchase.amount),
        paymentMode: newPurchase.paymentMode
      });
      setNewPurchase({ ...newPurchase, vendor: '', description: '', notes: '', amount: '' });
    } catch {
      // toast handled in hook
    }
  };

  const handleUpdatePurchase = async (id, updatedData) => {
    try {
      await updatePurchase(id, updatedData);
    } catch {
      // toast handled in hook
    }
  };

  const handleDeletePurchase = async (id) => {
    try {
      await deletePurchase(id);
    } catch {
      // toast handled in hook
    }
  };

  const handleAddPassBatch = async (e) => {
    e.preventDefault();
    if (!newPassBatch.passesBought || !newPassBatch.batchNo) return;
    const bought = Number(newPassBatch.passesBought);
    const cost = Number(newPassBatch.costPerPass || 350);
    const issueDate = newPassBatch.issueDate || todayStr;
    const validityDays = Number(newPassBatch.validityDays || passSettings?.defaultValidityDays || 30);
    const validTill = newPassBatch.validTill || newPassBatch.dueDate || addDaysToDate(issueDate, validityDays);

    try {
      await createBatch({
        batchNo: newPassBatch.batchNo.trim().toUpperCase(),
        totalPasses: bought,
        feePerPass: cost,
        issueDate,
        validityDays,
        validTill,
        note: newPassBatch.notes || ''
      });
      setNewPassBatch({
        batchNo: '',
        passesBought: '',
        costPerPass: 350,
        issueDate: todayStr,
        validityDays: passSettings?.defaultValidityDays || 30,
        validTill: addDaysToDate(todayStr, passSettings?.defaultValidityDays || 30),
        dueDate: addDaysToDate(todayStr, passSettings?.defaultValidityDays || 30)
      });
    } catch {
      // toast handled in hook
    }
  };

  const nextExpiringBatch = useMemo(() => getNextExpiry(passBatches), [passBatches]);
  const hasExpiringPasses = Boolean(nextExpiringBatch?.isExpiringSoon);

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'theme-dark bg-[#0B0F17] text-slate-100' : 'theme-light bg-slate-50 text-slate-900'} flex flex-col lg:flex-row transition-colors duration-200`}>
      {/* Toast Notification (Bottom-Right, Auto-Dismiss) */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Global Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        sales={sales}
        purchases={purchases}
        agents={agents}
        onSelectResult={(res) => {
          if (res.type === 'tab') setActiveTab(res.tab);
          if (res.type === 'agent') {
            setActiveTab('sales');
            setSelectedAgent(res.value);
            setSelectedSubBuyer('ALL');
          }
        }}
      />

      {/* Left Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        salesCount={sales.length}
        purchasesCount={purchases.length}
        hasExpiringPasses={hasExpiringPasses}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Top Header Bar */}
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          stats={stats}
          passBatches={passBatches}
          passSettings={passSettings}
          isDarkTheme={isDarkTheme}
          setIsDarkTheme={setIsDarkTheme}
          onOpenSearch={() => setIsSearchOpen(true)}
          onExport={() => {
            setActiveTab('reports');
            showToast('Opening Date-Range Quarry Reports');
          }}
        />

        {/* Main View Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <AnimatePresence mode="wait">
            {/* 1. Main Dashboard Tab: KPI Cards + Chart + Summaries */}
            {activeTab === 'dashboard' && (
              <DashboardView
                key="dashboard"
                stats={stats}
                sales={sales}
                purchases={purchases}
                passBatches={passBatches}
                purchaseCategoryStats={purchaseCategoryStats}
                setActiveTab={setActiveTab}
                formatDate={formatDate}
              />
            )}

            {/* 2. Sales Tab: Sales-only Stats + Dynamic Agent Tree + Lorry Dispatch + Ledger */}
            {activeTab === 'sales' && (
              <SalesView
                key="sales"
                sales={sales}
                passBatches={passBatches}
                treasuryBalance={treasuryBalance}
                handleWithdrawFromTreasury={handleWithdrawFromTreasury}
                setActiveTab={setActiveTab}
                agents={agents}
                subBuyers={subBuyers}
                selectedAgent={selectedAgent}
                setSelectedAgent={setSelectedAgent}
                selectedSubBuyer={selectedSubBuyer}
                setSelectedSubBuyer={setSelectedSubBuyer}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filteredSales={filteredSales}
                newSale={newSale}
                setNewSale={setNewSale}
                handleAddSale={handleAddSale}
                handleAddAgent={addAgent}
                handleUpdateAgent={updateAgent}
                handleDeleteAgent={deleteAgent}
                handleToggleStatus={toggleAgentStatus}
                handleAddSubBuyer={addSubBuyer}
                getAgentStats={getAgentStats}
                topAgentName={getTopAgent(sales)}
                showToast={showToast}
                formatDate={formatDate}
                isLoadingAgents={isLoadingAgents}
                isLoadingSales={isLoadingSales}
              />
            )}

            {/* 3. Purchases & Rent Tab: Purchase-only Stats + Category Cards + Entry + Ledger */}
            {activeTab === 'purchase' && (
              <PurchasesView
                key="purchase"
                purchases={purchases}
                purchaseCategoryStats={purchaseCategoryStats}
                newPurchase={newPurchase}
                setNewPurchase={setNewPurchase}
                handleAddPurchase={handleAddPurchase}
                handleUpdatePurchase={handleUpdatePurchase}
                handleDeletePurchase={handleDeletePurchase}
                formatDate={formatDate}
                isLoading={isLoadingPurchases}
              />
            )}

            {/* 4. Govt Pass Tracker Tab: 3 Views (Active Batches, Ledger, Treasury) */}
            {activeTab === 'pass' && (
              <PassesView
                key="pass"
                stats={stats}
                passBatches={passBatches}
                treasuryLedger={treasuryLedger}
                sales={sales}
                newPassBatch={newPassBatch}
                setNewPassBatch={setNewPassBatch}
                handleAddPassBatch={handleAddPassBatch}
                handleWithdrawFromTreasury={handleWithdrawFromTreasury}
                handleReturnToTreasuryManual={handleReturnToTreasuryManual}
                formatDate={formatDate}
                showToast={showToast}
                passSettings={passSettings}
                onSavePassSettings={handleSavePassSettings}
              />
            )}

            {/* 5. Date-Wise Reports & Statement Tab */}
            {activeTab === 'reports' && (
              <ReportsView
                key="reports"
                sales={sales}
                purchases={purchases}
                passBatches={passBatches}
                agents={agents}
                showToast={showToast}
                formatDate={formatDate}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Global Bottom Footer */}
        <footer className="mt-auto py-5 border-t border-white/[0.06] text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Blue Metal Quarry Management System</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Developed by</span>
              <span className="text-amber-400 font-bold tracking-wide">devozz</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
