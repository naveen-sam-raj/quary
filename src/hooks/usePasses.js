import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import { getBatchStatus } from '../utils/passHelpers';

export function usePasses(warningDays = 7) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  // 1. Fetch Batches
  const batchesQuery = useQuery({
    queryKey: ['pass-batches'],
    queryFn: async () => {
      const res = await api.get('/passes/batches');
      return res.data?.data?.items || [];
    }
  });

  // 2. Fetch Passes Summary from backend
  const summaryQuery = useQuery({
    queryKey: ['passes-summary'],
    queryFn: async () => {
      const res = await api.get('/passes/summary');
      return res.data?.data || null;
    }
  });

  // 3. Fetch Alerts from backend
  const alertsQuery = useQuery({
    queryKey: ['pass-alerts'],
    queryFn: async () => {
      const res = await api.get('/passes/alerts');
      return res.data?.data || null;
    }
  });

  const rawBatches = batchesQuery.data || [];

  // Normalize batches for components
  const passBatches = useMemo(() => {
    return rawBatches.map((b) => {
      const issueDateStr = b.issueDate ? b.issueDate.split('T')[0] : '';
      const validTillStr = b.validTill ? b.validTill.split('T')[0] : null;
      const total = Number(b.totalPasses !== undefined ? b.totalPasses : b.passesBought || 0);
      const used = Number(b.usedPasses || 0);
      const returned = Number(b.returnedToTreasury || 0);
      const remaining = Math.max(0, total - used - returned);

      const normalized = {
        ...b,
        id: b._id,
        _id: b._id,
        batchNo: b.batchNo,
        source: b.source || 'govt',
        totalPasses: total,
        passesBought: total,
        usedPasses: used,
        returnedToTreasury: returned,
        remaining,
        feePerPass: Number(b.feePerPass || 0),
        costPerPass: Number(b.feePerPass || 0),
        totalCost: total * Number(b.feePerPass || 0),
        issueDate: issueDateStr,
        date: issueDateStr,
        validTill: validTillStr,
        dueDate: validTillStr,
        validityDays: b.validityDays,
        status: b.status
      };

      const statusInfo = getBatchStatus(normalized, today, warningDays);
      return {
        ...normalized,
        statusInfo
      };
    });
  }, [rawBatches, today, warningDays]);

  // 4. Create Batch Mutation
  const createBatchMutation = useMutation({
    mutationFn: async (batchData) => {
      const payload = {
        batchNo: (batchData.batchNo || '').trim(),
        totalPasses: Number(batchData.totalPasses || batchData.passesBought || 0),
        issueDate: batchData.issueDate || today,
        validityDays: batchData.validityDays !== undefined ? Number(batchData.validityDays) : undefined,
        validTill: batchData.validTill || batchData.dueDate || undefined,
        feePerPass: Number(batchData.feePerPass || batchData.costPerPass || 0),
        note: (batchData.note || batchData.description || '').trim()
      };

      const res = await api.post('/passes/batches', payload);
      return res.data?.data?.batch;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pass-batches'] });
      queryClient.invalidateQueries({ queryKey: ['passes-summary'] });
      queryClient.invalidateQueries({ queryKey: ['pass-alerts'] });
      toast.success(`✓ Batch ${data?.batchNo || ''} registered successfully`);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create pass batch';
      toast.error(msg);
    }
  });

  // 5. Return Batch Early Mutation
  const returnBatchMutation = useMutation({
    mutationFn: async ({ id, note }) => {
      const res = await api.patch(`/passes/batches/${id}/return`, { note: note || '' });
      return res.data?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pass-batches'] });
      queryClient.invalidateQueries({ queryKey: ['passes-summary'] });
      queryClient.invalidateQueries({ queryKey: ['pass-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['treasury-summary'] });
      queryClient.invalidateQueries({ queryKey: ['treasury-ledger'] });
      toast.success(`✓ Returned ${data?.returnedPasses || 0} passes to Sam Blue Metal Treasury`);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to return batch';
      toast.error(msg);
    }
  });

  const createBatch = useCallback(
    (batchData) => {
      return createBatchMutation.mutateAsync(batchData);
    },
    [createBatchMutation]
  );

  const returnBatch = useCallback(
    (id, note) => {
      return returnBatchMutation.mutateAsync({ id, note });
    },
    [returnBatchMutation]
  );

  return {
    passBatches,
    summary: summaryQuery.data,
    alerts: alertsQuery.data,
    createBatch,
    returnBatch,
    isLoading: batchesQuery.isLoading || summaryQuery.isLoading,
    isError: batchesQuery.isError,
    error: batchesQuery.error,
    refetch: () => {
      batchesQuery.refetch();
      summaryQuery.refetch();
      alertsQuery.refetch();
    }
  };
}
