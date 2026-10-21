// Helper functions for Govt Transit Pass Due Date & Expiry Management

export const DEFAULT_PASS_SETTINGS = {
  defaultValidityDays: 30,
  warningDays: 7
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
// Statuses: 'Active' | 'Expiring Soon' | 'Expired' | 'Exhausted' | 'Surrendered'
export const getBatchStatus = (batch, today = new Date().toISOString().split('T')[0], warningDays = 7) => {
  const bought = Number(batch.passesBought || 0);
  const used = Number(batch.usedPasses || 0);
  const surrendered = Number(batch.surrenderedPasses || 0);
  const unused = Math.max(0, bought - used - surrendered);

  if (surrendered > 0 && unused === 0 && used === 0) {
    return {
      status: 'Surrendered',
      color: 'blue',
      label: 'Surrendered',
      daysLeft: 0,
      unused
    };
  }

  if (unused === 0 && bought > 0) {
    return {
      status: 'Exhausted',
      color: 'slate',
      label: 'Exhausted (All Used)',
      daysLeft: 0,
      unused: 0
    };
  }

  const daysLeft = getDaysDiff(batch.dueDate, today);

  if (daysLeft < 0) {
    return {
      status: 'Expired',
      color: 'rose',
      label: `Expired (${Math.abs(daysLeft)}d ago)`,
      daysLeft,
      unused
    };
  }

  if (daysLeft <= Number(warningDays)) {
    const daysLabel = daysLeft === 0 ? 'Expires Today' : `Expires in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`;
    return {
      status: 'Expiring Soon',
      color: 'amber',
      label: daysLabel,
      daysLeft,
      unused
    };
  }

  return {
    status: 'Active',
    color: 'emerald',
    label: `${daysLeft} days left`,
    daysLeft,
    unused
  };
};

// Compute Valid (non-expired, non-surrendered) remaining passes
export const getValidPassCount = (batches, today = new Date().toISOString().split('T')[0]) => {
  return batches.reduce((sum, b) => {
    const statusInfo = getBatchStatus(b, today);
    if (statusInfo.status === 'Active' || statusInfo.status === 'Expiring Soon') {
      return sum + statusInfo.unused;
    }
    return sum;
  }, 0);
};

// Compute Expired / Lost passes summary
export const getExpiredLossSummary = (batches, today = new Date().toISOString().split('T')[0]) => {
  let expiredPasses = 0;
  let expiredValue = 0;
  let surrenderedPasses = 0;

  batches.forEach(b => {
    const statusInfo = getBatchStatus(b, today);
    if (statusInfo.status === 'Expired') {
      const lost = statusInfo.unused;
      expiredPasses += lost;
      expiredValue += lost * Number(b.costPerPass || 0);
    }
    if (b.surrenderedPasses) {
      surrenderedPasses += Number(b.surrenderedPasses);
    }
  });

  return {
    expiredPasses,
    expiredValue,
    surrenderedPasses
  };
};

// Next expiring batch info
export const getNextExpiry = (batches, today = new Date().toISOString().split('T')[0]) => {
  const validBatches = batches
    .map(b => ({ ...b, statusInfo: getBatchStatus(b, today) }))
    .filter(b => (b.statusInfo.status === 'Active' || b.statusInfo.status === 'Expiring Soon') && b.statusInfo.unused > 0)
    .sort((a, b) => a.statusInfo.daysLeft - b.statusInfo.daysLeft);

  if (validBatches.length === 0) return null;
  const next = validBatches[0];
  return {
    batchNo: next.batchNo,
    daysLeft: next.statusInfo.daysLeft,
    dueDate: next.dueDate,
    unusedPasses: next.statusInfo.unused,
    costPerPass: next.costPerPass,
    atRiskValue: next.statusInfo.unused * Number(next.costPerPass || 0),
    isExpiringSoon: next.statusInfo.status === 'Expiring Soon'
  };
};

// Next batch to be used according to FIFO (Earliest Due Date)
export const getNextBatchForDispatch = (batches, today = new Date().toISOString().split('T')[0]) => {
  const validBatches = batches
    .map(b => ({ ...b, statusInfo: getBatchStatus(b, today) }))
    .filter(b => (b.statusInfo.status === 'Active' || b.statusInfo.status === 'Expiring Soon') && b.statusInfo.unused > 0)
    .sort((a, b) => a.statusInfo.daysLeft - b.statusInfo.daysLeft);

  if (validBatches.length === 0) return null;
  const target = validBatches[0];
  return {
    id: target.id,
    batchNo: target.batchNo,
    daysLeft: target.statusInfo.daysLeft,
    dueDate: target.dueDate,
    unusedPasses: target.statusInfo.unused,
    costPerPass: target.costPerPass
  };
};

// Deduct passes using FIFO
export const consumePassFIFO = (batches, passesNeeded = 1, today = new Date().toISOString().split('T')[0]) => {
  let needed = Number(passesNeeded);
  const totalAvailable = getValidPassCount(batches, today);

  if (totalAvailable < needed) {
    return {
      success: false,
      error: `Only ${totalAvailable} valid passes available in stock. Cannot dispatch ${needed} passes.`,
      updatedBatches: batches
    };
  }

  // Sort batches by dueDate ascending (earliest expiry first)
  const validIds = batches
    .map(b => ({ id: b.id, statusInfo: getBatchStatus(b, today) }))
    .filter(b => (b.statusInfo.status === 'Active' || b.statusInfo.status === 'Expiring Soon') && b.statusInfo.unused > 0)
    .map(b => b.id);

  const deductions = [];

  const updatedBatches = batches.map(batch => {
    if (!validIds.includes(batch.id) || needed <= 0) {
      return batch;
    }

    const bought = Number(batch.passesBought || 0);
    const used = Number(batch.usedPasses || 0);
    const surrendered = Number(batch.surrenderedPasses || 0);
    const availableInBatch = Math.max(0, bought - used - surrendered);

    const take = Math.min(availableInBatch, needed);
    if (take > 0) {
      needed -= take;
      deductions.push({
        batchId: batch.id,
        batchNo: batch.batchNo,
        count: take
      });
      return {
        ...batch,
        usedPasses: used + take
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

// Initial Seed Pass Batches with Issue Date, Validity, Due Date, and Statuses
export const INITIAL_BATCHES_WITH_EXPIRY = [
  {
    id: 'GP-01',
    date: '2026-10-01',
    batchNo: 'TN-GEO-2026-881',
    passesBought: 50,
    usedPasses: 30,
    costPerPass: 350,
    totalCost: 17500,
    authority: 'Dept of Geology & Mining',
    issueDate: '2026-10-01',
    validityDays: 25,
    dueDate: '2026-10-26', // Expires in 5 days from Oct 21
    surrenderedPasses: 0,
    surrenderNote: ''
  },
  {
    id: 'GP-02',
    date: '2026-10-12',
    batchNo: 'TN-GEO-2026-942',
    passesBought: 30,
    usedPasses: 0,
    costPerPass: 350,
    totalCost: 10500,
    authority: 'Dept of Geology & Mining',
    issueDate: '2026-10-12',
    validityDays: 30,
    dueDate: '2026-11-11', // Active (21 days left)
    surrenderedPasses: 0,
    surrenderNote: ''
  },
  {
    id: 'GP-03',
    date: '2026-09-01',
    batchNo: 'TN-GEO-2026-720',
    passesBought: 25,
    usedPasses: 17,
    costPerPass: 350,
    totalCost: 8750,
    authority: 'Dept of Geology & Mining',
    issueDate: '2026-09-01',
    validityDays: 30,
    dueDate: '2026-10-01', // Expired on 01 Oct (8 passes lost)
    surrenderedPasses: 0,
    surrenderNote: 'Unused passes expired before dispatch'
  }
];
