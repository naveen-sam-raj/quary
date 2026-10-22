// Helper functions for Govt Transit Pass Due Date & Sam Blue Metal Treasury Management

export const DEFAULT_PASS_SETTINGS = {
  defaultValidityDays: 30,
  warningDays: 7,
  lowStockLimit: 10
};

export const getPassSettings = () => {
  try {
    const saved = localStorage.getItem('quarry_pass_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_PASS_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load quarry_pass_settings', e);
  }
  return DEFAULT_PASS_SETTINGS;
};

export const savePassSettings = (settings) => {
  try {
    localStorage.setItem('quarry_pass_settings', JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save quarry_pass_settings', e);
  }
};

// Calculate Date + Days
export const addDaysToDate = (dateStr, days) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().split('T')[0];
};

// Days difference between target and base (positive if future, negative if past)
export const getDaysDiff = (targetDateStr, baseDateStr = new Date().toISOString().split('T')[0]) => {
  if (!targetDateStr) return 0;
  const target = new Date(targetDateStr);
  const base = new Date(baseDateStr);
  target.setHours(0, 0, 0, 0);
  base.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - base.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

// Format date into "26 Oct 2026"
export const formatPassDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const [year, month, day] = parts;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
};

// Get Batch Status
// Statuses: 'Active' | 'Expiring Soon' | 'Returned to Treasury' | 'Exhausted' | 'Expired'
export const getBatchStatus = (batch, today = new Date().toISOString().split('T')[0], warningDays = 7) => {
  const bought = Number(batch.totalPasses !== undefined ? batch.totalPasses : batch.passesBought || 0);
  const used = Number(batch.usedPasses || 0);
  const returned = Number(batch.returnedToTreasury || 0);
  const surrendered = Number(batch.surrenderedPasses || 0);
  const isTreasury = batch.source === 'treasury';

  // 1. Treasury Batch (No validity, no expiry)
  if (isTreasury) {
    const unusedTreasury = Math.max(0, bought - used);
    if (unusedTreasury === 0 && bought > 0) {
      return {
        status: 'Exhausted',
        color: 'slate',
        label: 'Exhausted (All Used)',
        daysLeft: null,
        unused: 0,
        isTreasury: true
      };
    }
    return {
      status: 'Active',
      color: 'emerald',
      label: 'No expiry',
      daysLeft: null,
      unused: unusedTreasury,
      isTreasury: true
    };
  }

  // 2. Returned to Treasury
  if (batch.status === 'Returned to Treasury' || (returned > 0 && Math.max(0, bought - used - returned - surrendered) === 0)) {
    return {
      status: 'Returned to Treasury',
      color: 'blue',
      label: 'Returned to Treasury',
      daysLeft: 0,
      unused: 0,
      isTreasury: false
    };
  }

  // 3. Surrendered to Dept
  if (surrendered > 0 && Math.max(0, bought - used - returned - surrendered) === 0 && used === 0) {
    return {
      status: 'Surrendered',
      color: 'blue',
      label: 'Surrendered',
      daysLeft: 0,
      unused: 0,
      isTreasury: false
    };
  }

  const unused = Math.max(0, bought - used - returned - surrendered);

  // 4. Exhausted (all used)
  if (unused === 0 && bought > 0) {
    return {
      status: 'Exhausted',
      color: 'slate',
      label: 'Exhausted (All Used)',
      daysLeft: 0,
      unused: 0,
      isTreasury: false
    };
  }

  const validTillDate = batch.validTill || batch.dueDate;
  const daysLeft = getDaysDiff(validTillDate, today);

  // 5. Expired
  if (daysLeft < 0) {
    return {
      status: 'Expired',
      color: 'rose',
      label: `Expired (${Math.abs(daysLeft)}d ago)`,
      daysLeft,
      unused,
      isTreasury: false
    };
  }

  // 6. Expiring Soon (warningDays or fewer)
  if (daysLeft <= Number(warningDays)) {
    const daysLabel = daysLeft === 0 ? 'Expires Today' : `${daysLeft} ${daysLeft === 1 ? 'day left' : 'days left'}`;
    return {
      status: 'Expiring Soon',
      color: 'amber',
      label: daysLabel,
      daysLeft,
      unused,
      isTreasury: false
    };
  }

  // 7. Active
  return {
    status: 'Active',
    color: 'emerald',
    label: `${daysLeft} days left`,
    daysLeft,
    unused,
    isTreasury: false
  };
};

// Compute Active Remaining Passes (valid govt passes + treasury-withdrawn passes not yet used)
export const getActivePassCount = (batches = [], today = new Date().toISOString().split('T')[0]) => {
  return batches.reduce((sum, b) => {
    const statusInfo = getBatchStatus(b, today);
    if (statusInfo.status === 'Active' || statusInfo.status === 'Expiring Soon') {
      return sum + statusInfo.unused;
    }
    return sum;
  }, 0);
};

// Backwards compatibility alias
export const getValidPassCount = getActivePassCount;

// Compute Treasury Balance: sum(received) - sum(withdrawn)
export const getTreasuryBalance = (ledger = []) => {
  return ledger.reduce((balance, entry) => {
    const count = Number(entry.passes || 0);
    if (entry.type === 'received_expired' || entry.type === 'received_manual') {
      return balance + count;
    }
    if (entry.type === 'withdrawn') {
      return balance - count;
    }
    return balance;
  }, 0);
};

// Compute comprehensive Treasury Stats: Received, Withdrawn, Spent, Balance
export const getTreasuryStats = (ledger = [], batches = []) => {
  let totalReceived = 0;
  let totalWithdrawn = 0;

  ledger.forEach(entry => {
    const count = Number(entry.passes || 0);
    if (entry.type === 'received_expired' || entry.type === 'received_manual') {
      totalReceived += count;
    } else if (entry.type === 'withdrawn') {
      totalWithdrawn += count;
    }
  });

  const balance = Math.max(0, totalReceived - totalWithdrawn);

  // Spent = passes used by lorries from withdrawn treasury batches
  const totalSpent = batches
    .filter(b => b.source === 'treasury')
    .reduce((sum, b) => sum + Number(b.usedPasses || 0), 0);

  // Govt Passes Used
  const govtSpent = batches
    .filter(b => b.source !== 'treasury')
    .reduce((sum, b) => sum + Number(b.usedPasses || 0), 0);

  return {
    totalReceived,
    totalWithdrawn,
    totalSpent,
    balance,
    govtSpent
  };
};

// Auto-return on expiry:
// When today > Valid Till and a govt batch has unused passes, return to treasury
// Idempotent (never processes the same batch twice)
export const autoReturnExpired = (batches = [], ledger = [], today = new Date().toISOString().split('T')[0]) => {
  let hasChanges = false;
  const newLedgerEntries = [];

  const updatedBatches = batches.map(batch => {
    // Treasury batches never expire
    if (batch.source === 'treasury') return batch;

    const validTill = batch.validTill || batch.dueDate;
    if (!validTill) return batch;

    const daysDiff = getDaysDiff(validTill, today);
    // Expired when daysDiff < 0 (i.e. today > validTill)
    if (daysDiff < 0) {
      // Check if already returned or already recorded in ledger
      if (batch.status === 'Returned to Treasury' || Number(batch.returnedToTreasury || 0) > 0) {
        return batch;
      }
      const alreadyInLedger = ledger.some(
        l => l.batchId === batch.id && (l.type === 'received_expired' || l.type === 'received_manual')
      );
      if (alreadyInLedger) {
        if (batch.status !== 'Returned to Treasury') {
          hasChanges = true;
          return { ...batch, status: 'Returned to Treasury' };
        }
        return batch;
      }

      const bought = Number(batch.totalPasses !== undefined ? batch.totalPasses : batch.passesBought || 0);
      const used = Number(batch.usedPasses || 0);
      const surrendered = Number(batch.surrenderedPasses || 0);
      const unused = Math.max(0, bought - used - surrendered);

      if (unused > 0) {
        hasChanges = true;
        const entryId = `TL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        newLedgerEntries.push({
          id: entryId,
          date: today,
          type: 'received_expired',
          batchId: batch.id,
          batchNo: batch.batchNo,
          passes: unused,
          note: 'Auto-returned on expiry'
        });

        return {
          ...batch,
          returnedToTreasury: unused,
          status: 'Returned to Treasury'
        };
      } else {
        // Unused is 0, mark as exhausted if not already
        if (batch.status !== 'Exhausted') {
          hasChanges = true;
          return { ...batch, status: 'Exhausted' };
        }
      }
    }
    return batch;
  });

  return {
    changed: hasChanges,
    updatedBatches,
    updatedLedger: newLedgerEntries.length > 0 ? [...newLedgerEntries, ...ledger] : ledger,
    returnedCount: newLedgerEntries.reduce((sum, e) => sum + e.passes, 0)
  };
};

// Withdraw passes from Treasury:
// Decreases balance, creates new batch { source: 'treasury', batchNo: 'TRS-2026-xxx', validTill: null, fee: 0 }
export const withdrawFromTreasury = (
  ledger = [],
  batches = [],
  passesNeeded = 1,
  note = '',
  today = new Date().toISOString().split('T')[0]
) => {
  const needed = Number(passesNeeded);
  const currentBalance = getTreasuryBalance(ledger);

  if (needed <= 0) {
    return { success: false, error: 'Passes needed must be at least 1' };
  }
  if (needed > currentBalance) {
    return {
      success: false,
      error: `Cannot withdraw ${needed} passes. Only ${currentBalance} available in Treasury.`
    };
  }

  const year = today.split('-')[0] || '2026';
  const existingTrsBatches = batches.filter(b => b.source === 'treasury');
  const nextTrsNum = existingTrsBatches.length + 1;
  const batchNo = `TRS-${year}-${String(nextTrsNum).padStart(3, '0')}`;
  const newBatchId = `TRS-${Date.now().toString().slice(-4)}`;

  const newBatch = {
    id: newBatchId,
    batchNo,
    source: 'treasury',
    totalPasses: needed,
    passesBought: needed,
    usedPasses: 0,
    returnedToTreasury: 0,
    surrenderedPasses: 0,
    issueDate: today,
    date: today,
    validityDays: null,
    validTill: null,
    dueDate: null,
    feePerPass: 0,
    costPerPass: 0,
    totalCost: 0,
    status: 'Active',
    authority: 'Sam Blue Metal Treasury'
  };

  const ledgerEntry = {
    id: `TL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    date: today,
    type: 'withdrawn',
    batchId: newBatch.id,
    batchNo: newBatch.batchNo,
    passes: needed,
    note: note?.trim() || 'Withdrawn for lorry dispatches'
  };

  return {
    success: true,
    newBatch,
    ledgerEntry,
    updatedLedger: [ledgerEntry, ...ledger],
    updatedBatches: [newBatch, ...batches]
  };
};

// Early manual return to Treasury
export const returnToTreasuryManual = (
  batchId,
  ledger = [],
  batches = [],
  note = 'Manual early return to Treasury',
  today = new Date().toISOString().split('T')[0]
) => {
  const batch = batches.find(b => b.id === batchId);
  if (!batch) return { success: false, error: 'Batch not found' };

  if (batch.source === 'treasury') {
    return { success: false, error: 'Treasury-withdrawn passes cannot be returned to Treasury.' };
  }

  const bought = Number(batch.totalPasses !== undefined ? batch.totalPasses : batch.passesBought || 0);
  const used = Number(batch.usedPasses || 0);
  const returned = Number(batch.returnedToTreasury || 0);
  const surrendered = Number(batch.surrenderedPasses || 0);
  const unused = Math.max(0, bought - used - returned - surrendered);

  if (unused <= 0) {
    return { success: false, error: 'No unused passes left in this batch to return.' };
  }

  const ledgerEntry = {
    id: `TL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    date: today,
    type: 'received_manual',
    batchId: batch.id,
    batchNo: batch.batchNo,
    passes: unused,
    note: note?.trim() || 'Manual early return to Treasury'
  };

  const updatedBatches = batches.map(b => {
    if (b.id === batchId) {
      return {
        ...b,
        returnedToTreasury: (b.returnedToTreasury || 0) + unused,
        status: 'Returned to Treasury'
      };
    }
    return b;
  });

  return {
    success: true,
    unused,
    ledgerEntry,
    updatedLedger: [ledgerEntry, ...ledger],
    updatedBatches
  };
};

// Next batch to be used according to FIFO:
// 1. Govt batches first, the one expiring earliest first (today <= validTill)
// 2. Treasury batches only after all govt batches are empty
export const getNextBatchForDispatch = (batches = [], today = new Date().toISOString().split('T')[0]) => {
  // Available Govt batches with remaining > 0, valid, sorted by validTill ascending
  const govtBatches = batches
    .filter(b => b.source !== 'treasury')
    .map(b => ({ ...b, statusInfo: getBatchStatus(b, today) }))
    .filter(b => (b.statusInfo.status === 'Active' || b.statusInfo.status === 'Expiring Soon') && b.statusInfo.unused > 0)
    .sort((a, b) => (a.statusInfo.daysLeft ?? 9999) - (b.statusInfo.daysLeft ?? 9999));

  if (govtBatches.length > 0) {
    const target = govtBatches[0];
    const daysLeft = target.statusInfo.daysLeft;
    return {
      id: target.id,
      batchNo: target.batchNo,
      source: 'govt',
      isTreasury: false,
      daysLeft,
      validTill: target.validTill || target.dueDate,
      unusedPasses: target.statusInfo.unused,
      costPerPass: target.feePerPass || target.costPerPass,
      displayLabel: `Pass from: ${target.batchNo} (${daysLeft <= 0 ? 'expires today' : `expires in ${daysLeft} days`})`
    };
  }

  // If all govt batches empty, check Treasury-withdrawn batches (no expiry)
  const treasuryBatches = batches
    .filter(b => b.source === 'treasury')
    .map(b => ({ ...b, statusInfo: getBatchStatus(b, today) }))
    .filter(b => b.statusInfo.unused > 0)
    .sort((a, b) => new Date(a.issueDate || a.date).getTime() - new Date(b.issueDate || b.date).getTime());

  if (treasuryBatches.length > 0) {
    const target = treasuryBatches[0];
    return {
      id: target.id,
      batchNo: target.batchNo,
      source: 'treasury',
      isTreasury: true,
      daysLeft: null,
      validTill: null,
      unusedPasses: target.statusInfo.unused,
      costPerPass: 0,
      displayLabel: `Pass from: Treasury batch ${target.batchNo} (no expiry)`
    };
  }

  return null;
};

// Deduct passes using FIFO order:
// 1. Govt batches first, expiring earliest first
// 2. Treasury-withdrawn batches only after all govt batches are empty
export const consumePassFIFO = (batches = [], passesNeeded = 1, today = new Date().toISOString().split('T')[0]) => {
  let needed = Number(passesNeeded);
  const totalAvailable = getActivePassCount(batches, today);

  if (totalAvailable < needed) {
    return {
      success: false,
      error: `Only ${totalAvailable} active passes available. Cannot dispatch ${needed} passes.`,
      updatedBatches: batches,
      deductions: []
    };
  }

  // Sort candidate batches:
  // First, valid Govt batches sorted by validTill ascending
  const govtCandidates = batches
    .filter(b => b.source !== 'treasury')
    .map(b => ({ batch: b, statusInfo: getBatchStatus(b, today) }))
    .filter(c => (c.statusInfo.status === 'Active' || c.statusInfo.status === 'Expiring Soon') && c.statusInfo.unused > 0)
    .sort((a, b) => (a.statusInfo.daysLeft ?? 9999) - (b.statusInfo.daysLeft ?? 9999))
    .map(c => c.batch.id);

  // Second, Treasury batches sorted by date ascending
  const treasuryCandidates = batches
    .filter(b => b.source === 'treasury')
    .map(b => ({ batch: b, statusInfo: getBatchStatus(b, today) }))
    .filter(c => c.statusInfo.unused > 0)
    .sort((a, b) => new Date(a.batch.issueDate || a.batch.date).getTime() - new Date(b.batch.issueDate || b.batch.date).getTime())
    .map(c => c.batch.id);

  const priorityOrder = [...govtCandidates, ...treasuryCandidates];
  const deductions = [];
  const batchDeductionMap = {};

  for (const batchId of priorityOrder) {
    if (needed <= 0) break;
    const batch = batches.find(b => b.id === batchId);
    if (!batch) continue;

    const bought = Number(batch.totalPasses !== undefined ? batch.totalPasses : batch.passesBought || 0);
    const used = Number(batch.usedPasses || 0);
    const returned = Number(batch.returnedToTreasury || 0);
    const surrendered = Number(batch.surrenderedPasses || 0);
    const available = Math.max(0, bought - used - returned - surrendered);

    const take = Math.min(available, needed);
    if (take > 0) {
      needed -= take;
      deductions.push({
        batchId: batch.id,
        batchNo: batch.batchNo,
        source: batch.source || 'govt',
        count: take
      });
      batchDeductionMap[batch.id] = (batchDeductionMap[batch.id] || 0) + take;
    }
  }

  const updatedBatches = batches.map(batch => {
    if (batchDeductionMap[batch.id]) {
      const newUsed = Number(batch.usedPasses || 0) + batchDeductionMap[batch.id];
      const bought = Number(batch.totalPasses !== undefined ? batch.totalPasses : batch.passesBought || 0);
      const returned = Number(batch.returnedToTreasury || 0);
      const surrendered = Number(batch.surrenderedPasses || 0);
      const isExhausted = (bought - newUsed - returned - surrendered) <= 0;

      return {
        ...batch,
        usedPasses: newUsed,
        status: isExhausted ? 'Exhausted' : batch.status
      };
    }
    return batch;
  });

  return {
    success: true,
    deductions,
    updatedBatches
  };
};

// Next expiring govt batch info
export const getNextExpiry = (batches = [], today = new Date().toISOString().split('T')[0]) => {
  const validBatches = batches
    .filter(b => b.source !== 'treasury')
    .map(b => ({ ...b, statusInfo: getBatchStatus(b, today) }))
    .filter(b => (b.statusInfo.status === 'Active' || b.statusInfo.status === 'Expiring Soon') && b.statusInfo.unused > 0)
    .sort((a, b) => (a.statusInfo.daysLeft ?? 9999) - (b.statusInfo.daysLeft ?? 9999));

  if (validBatches.length === 0) return null;
  const next = validBatches[0];
  return {
    id: next.id,
    batchNo: next.batchNo,
    daysLeft: next.statusInfo.daysLeft,
    validTill: next.validTill || next.dueDate,
    dueDate: next.validTill || next.dueDate,
    unusedPasses: next.statusInfo.unused,
    costPerPass: next.feePerPass || next.costPerPass,
    feePerPass: next.feePerPass || next.costPerPass,
    isExpiringSoon: next.statusInfo.status === 'Expiring Soon'
  };
};

// Expired loss summary
export const getExpiredLossSummary = (batches = [], today = new Date().toISOString().split('T')[0]) => {
  let expiredPasses = 0;
  let expiredValue = 0;
  let returnedPasses = 0;

  batches.forEach(b => {
    if (b.source === 'treasury') return;
    const statusInfo = getBatchStatus(b, today);
    if (statusInfo.status === 'Expired') {
      const lost = statusInfo.unused;
      expiredPasses += lost;
      expiredValue += lost * Number(b.feePerPass || b.costPerPass || 0);
    }
    if (b.returnedToTreasury) {
      returnedPasses += Number(b.returnedToTreasury);
    }
  });

  return {
    expiredPasses,
    expiredValue,
    returnedPasses
  };
};

// Initial Seed Demo Data:
// 1. One govt batch expiring in 5 days (from 2026-10-22: expires 2026-10-27)
// 2. One active govt batch with 20 days validity
// 3. One already expired batch with 20 unused passes returned to Treasury (so Treasury shows a balance for testing)
export const INITIAL_BATCHES_WITH_EXPIRY = [
  {
    id: 'GP-01',
    date: '2026-10-02',
    batchNo: 'TN-GEO-2026-881',
    source: 'govt',
    totalPasses: 50,
    passesBought: 50,
    usedPasses: 30,
    returnedToTreasury: 0,
    feePerPass: 350,
    costPerPass: 350,
    totalCost: 17500,
    authority: 'Dept of Geology & Mining',
    issueDate: '2026-10-02',
    validityDays: 25,
    validTill: '2026-10-27', // Expires in 5 days from Oct 22
    dueDate: '2026-10-27',
    status: 'Expiring Soon',
    surrenderedPasses: 0,
    surrenderNote: ''
  },
  {
    id: 'GP-02',
    date: '2026-10-12',
    batchNo: 'TN-GEO-2026-942',
    source: 'govt',
    totalPasses: 30,
    passesBought: 30,
    usedPasses: 0,
    returnedToTreasury: 0,
    feePerPass: 350,
    costPerPass: 350,
    totalCost: 10500,
    authority: 'Dept of Geology & Mining',
    issueDate: '2026-10-12',
    validityDays: 30,
    validTill: '2026-11-11', // Active (20 days left)
    dueDate: '2026-11-11',
    status: 'Active',
    surrenderedPasses: 0,
    surrenderNote: ''
  },
  {
    id: 'GP-03',
    date: '2026-09-01',
    batchNo: 'TN-GEO-2026-720',
    source: 'govt',
    totalPasses: 25,
    passesBought: 25,
    usedPasses: 5,
    returnedToTreasury: 20, // 20 passes returned to Treasury on expiry
    feePerPass: 350,
    costPerPass: 350,
    totalCost: 8750,
    authority: 'Dept of Geology & Mining',
    issueDate: '2026-09-01',
    validityDays: 30,
    validTill: '2026-10-01', // Expired on 01 Oct
    dueDate: '2026-10-01',
    status: 'Returned to Treasury',
    surrenderedPasses: 0,
    surrenderNote: 'Auto-returned to Sam Blue Metal Treasury on validity expiry'
  }
];

// Initial Treasury Ledger: holds the 20 auto-returned passes from GP-03
export const INITIAL_TREASURY_LEDGER = [
  {
    id: 'TL-INIT-01',
    date: '2026-10-01',
    type: 'received_expired',
    batchId: 'GP-03',
    batchNo: 'TN-GEO-2026-720',
    passes: 20,
    note: 'Auto-returned on expiry'
  }
];
