import React, { useState, useMemo, useEffect } from 'react';
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

import {
  getPassSettings,
  savePassSettings,
  consumePassFIFO,
  INITIAL_BATCHES_WITH_EXPIRY,
  getValidPassCount,
  getNextExpiry,
  addDaysToDate,
  formatPassDate
} from './utils/passHelpers';

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
    getTopAgent
  } = useAgents();

  // Core Data State
  const [sales, setSales] = useState(INITIAL_SALES);
  const [purchases, setPurchases] = useState(INITIAL_PURCHASES);

  // Pass Settings State
  const [passSettings, setPassSettings] = useState(() => getPassSettings());

  // Govt Pass Batches State with localStorage persistence
  const [passBatches, setPassBatches] = useState(() => {
    try {
      const saved = localStorage.getItem('quarry_pass_batches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load quarry_pass_batches', e);
    }
    return INITIAL_BATCHES_WITH_EXPIRY;
  });

  // Sync passBatches to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('quarry_pass_batches', JSON.stringify(passBatches));
    } catch (e) {
      console.warn('Failed to save quarry_pass_batches', e);
    }
  }, [passBatches]);

  // Recalculate status on page load, focus, and every minute
  const [, setTick] = useState(Date.now());
  useEffect(() => {
    const handleFocus = () => setTick(Date.now());
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(() => setTick(Date.now()), 60000);
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const handleSavePassSettings = (newSettings) => {
    setPassSettings(newSettings);
    savePassSettings(newSettings);
    showToast('✓ Pass rules & alert thresholds updated');
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

  // New Govt Pass Batch State with Issue Date, Validity, Due Date
  const todayStr = new Date().toISOString().split('T')[0];
  const [newPassBatch, setNewPassBatch] = useState({
    batchNo: '',
    passesBought: '',
    costPerPass: 350,
    issueDate: todayStr,
    validityDays: passSettings?.defaultValidityDays || 30,
    dueDate: addDaysToDate(todayStr, passSettings?.defaultValidityDays || 30)
  });

  const showToast = (msg, type = 'success') => {
    const text = typeof msg === 'string' ? msg : msg?.message;
    const toastType = typeof msg === 'object' && msg?.type ? msg.type : type;
    setToast({ message: text, type: toastType });
    setTimeout(() => setToast(null), 3000);
  };

  // Computed Summary Metrics
  const stats = useMemo(() => {
    const totalSalesAmount = sales.reduce((acc, s) => acc + Number(s.amount || 0), 0);
    const totalPurchaseAmount = purchases.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const totalPassCost = passBatches.reduce((acc, b) => acc + Number(b.totalCost || 0), 0);
    const totalExpenses = totalPurchaseAmount + totalPassCost;
    const netProfit = totalSalesAmount - totalExpenses;

    const totalPassesBought = passBatches.reduce((acc, b) => acc + Number(b.passesBought || 0), 0);
    const totalPassesUsed = passBatches.reduce((acc, b) => acc + Number(b.usedPasses || 0), 0);
    const remainingPasses = getValidPassCount(passBatches);

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
  const handleAddSale = (e) => {
    e.preventDefault();
    if (!newSale.amount || !newSale.lorryNo) return;
    const passesUsedNum = Number(newSale.passesUsed || 0);

    // If passes are used, consume FIFO from batches that expire first
    if (passesUsedNum > 0) {
      const deduction = consumePassFIFO(passBatches, passesUsedNum);
      if (!deduction.success) {
        showToast(deduction.error, 'error');
        return;
      }
      setPassBatches(deduction.updatedBatches);
    }

    const entry = {
      id: `S-${100 + sales.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      ...newSale,
      units: Number(newSale.units),
      passesUsed: passesUsedNum,
      amount: Number(newSale.amount)
    };
    setSales([entry, ...sales]);
    setNewSale({ ...newSale, lorryNo: '', amount: '' });
    showToast(`✓ Sale dispatched for Lorry ${entry.lorryNo}`);
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
    setNewPurchase({ ...newPurchase, vendor: '', description: '', notes: '', amount: '' });
    showToast(`✓ Recorded expense ₹${entry.amount.toLocaleString('en-IN')}`);
  };

  const handleAddPassBatch = (e) => {
    e.preventDefault();
    if (!newPassBatch.passesBought || !newPassBatch.batchNo) return;
    const bought = Number(newPassBatch.passesBought);
    const cost = Number(newPassBatch.costPerPass || 350);
    const issueDate = newPassBatch.issueDate || todayStr;
    const validityDays = Number(newPassBatch.validityDays || passSettings?.defaultValidityDays || 30);
    const dueDate = newPassBatch.dueDate || addDaysToDate(issueDate, validityDays);

    const entry = {
      id: `GP-0${passBatches.length + 1}`,
      date: issueDate,
      batchNo: newPassBatch.batchNo.trim().toUpperCase(),
      passesBought: bought,
      usedPasses: 0,
      costPerPass: cost,
      totalCost: bought * cost,
      authority: 'Dept of Geology & Mining',
      issueDate,
      validityDays,
      dueDate,
      surrenderedPasses: 0,
      surrenderNote: ''
    };
    setPassBatches([entry, ...passBatches]);
    setNewPassBatch({
      batchNo: '',
      passesBought: '',
      costPerPass: 350,
      issueDate: todayStr,
      validityDays: passSettings?.defaultValidityDays || 30,
      dueDate: addDaysToDate(todayStr, passSettings?.defaultValidityDays || 30)
    });
    showToast(`✓ Added ${bought} Govt Transit Passes (Expires ${formatPassDate(dueDate)})`);
  };

  const nextExpiringBatch = useMemo(() => getNextExpiry(passBatches), [passBatches]);
  const hasExpiringPasses = Boolean(nextExpiringBatch?.isExpiringSoon);

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'theme-dark bg-[#0B0F17] text-slate-100' : 'theme-light bg-slate-50 text-slate-900'} flex flex-col lg:flex-row transition-colors duration-200`}>
      {/* Toast Notification (Bottom-Right, Auto-Dismiss 3s) */}
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
                formatDate={formatDate}
              />
            )}

            {/* 4. Govt Pass Tracker Tab: Pass-only Stats + Stock Progress + Batch Entry + Ledgers */}
            {activeTab === 'pass' && (
              <PassesView
                key="pass"
                stats={stats}
                passBatches={passBatches}
                setPassBatches={setPassBatches}
                sales={sales}
                newPassBatch={newPassBatch}
                setNewPassBatch={setNewPassBatch}
                handleAddPassBatch={handleAddPassBatch}
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
