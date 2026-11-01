import api from '../api/client';
import toast from 'react-hot-toast';

/**
 * Trigger file download in browser from a Blob response
 */
function triggerBlobDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);
}

/**
 * Download Executive PDF Report
 * GET /api/export/report.pdf
 */
export async function downloadReportPdf(from, to) {
  try {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get('/export/report.pdf', {
      params,
      responseType: 'blob'
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const fromStr = from || 'current';
    const toStr = to || 'month';
    triggerBlobDownload(blob, `blue-metal-report-${fromStr}-to-${toStr}.pdf`);
    toast.success('✓ Executive PDF report downloaded');
  } catch (err) {
    const msg = err.response?.data?.message || 'Failed to download PDF report';
    toast.error(msg);
    throw err;
  }
}

/**
 * Download Loads Spreadsheet
 * GET /api/export/loads.xlsx
 */
export async function downloadLoadsExcel(from, to) {
  try {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get('/export/loads.xlsx', {
      params,
      responseType: 'blob'
    });
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    triggerBlobDownload(blob, 'loads.xlsx');
    toast.success('✓ Dispatched loads exported to Excel');
  } catch (err) {
    const msg = err.response?.data?.message || 'Failed to export loads to Excel';
    toast.error(msg);
    throw err;
  }
}

/**
 * Download Purchases Spreadsheet
 * GET /api/export/purchases.xlsx
 */
export async function downloadPurchasesExcel(from, to) {
  try {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get('/export/purchases.xlsx', {
      params,
      responseType: 'blob'
    });
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    triggerBlobDownload(blob, 'purchases.xlsx');
    toast.success('✓ Purchases & Rent exported to Excel');
  } catch (err) {
    const msg = err.response?.data?.message || 'Failed to export purchases to Excel';
    toast.error(msg);
    throw err;
  }
}

/**
 * Download Operational Backup
 * GET /api/backup/export (Admin only)
 */
export async function downloadBackupJson() {
  try {
    const res = await api.get('/backup/export', {
      responseType: 'blob'
    });
    const blob = new Blob([res.data], { type: 'application/json' });
    const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const y = nowIST.getUTCFullYear();
    const m = String(nowIST.getUTCMonth() + 1).padStart(2, '0');
    const d = String(nowIST.getUTCDate()).padStart(2, '0');
    const filename = `blue-metal-backup-${y}-${m}-${d}.json`;
    triggerBlobDownload(blob, filename);
    toast.success('✓ System backup exported successfully');
  } catch (err) {
    const msg = err.response?.data?.message || 'Failed to download backup';
    toast.error(msg);
    throw err;
  }
}
