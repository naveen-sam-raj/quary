import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';

export function useTreasury() {
  const queryClient = useQueryClient();

  // 1. Fetch Treasury Summary
  const summaryQuery = useQuery({
    queryKey: ['treasury-summary'],
    queryFn: async () => {
      const res = await api.get('/treasury/summary');
      return res.data?.data || { totalReceived: 0, totalWithdrawn: 0, spent: 0, balance: 0 };
    }
  });

  // 2. Fetch Treasury Ledger
  const ledgerQuery = useQuery({
    queryKey: ['treasury-ledger'],
    queryFn: async () => {
      const res = await api.get('/treasury/ledger?limit=100');
      return res.data?.data?.items || [];
    }
  });

  const rawLedger = ledgerQuery.data || [];

  const treasuryLedger = useMemo(() => {
    return rawLedger.map((item) => {
      const dateStr = item.date ? item.date.split('T')[0] : '';
      return {
        ...item,
        id: item._id,
        _id: item._id,
        date: dateStr,
        batchNo: item.batchId?.batchNo || item.batchNo || '',
        passes: Number(item.passes || 0),
        note: item.note || '',
        balanceAfter: item.balanceAfter !== undefined ? Number(item.balanceAfter) : undefined
      };
    });
  }, [rawLedger]);

  const summary = summaryQuery.data || { totalReceived: 0, totalWithdrawn: 0, spent: 0, balance: 0 };

  const treasuryStats = useMemo(() => {
    return {
      totalReceived: Number(summary.totalReceived || 0),
      totalWithdrawn: Number(summary.totalWithdrawn || 0),
      totalSpent: Number(summary.spent || 0),
      balance: Number(summary.balance || 0),
      govtSpent: 0
    };
  }, [summary]);

  // 3. Withdraw Mutation
  const withdrawMutation = useMutation({
    mutationFn: async ({ passes, note }) => {
      const payload = {
        passes: Number(passes),
        note: (note || '').trim()
      };
      const res = await api.post('/treasury/withdraw', payload);
      return res.data?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['treasury-summary'] });
      queryClient.invalidateQueries({ queryKey: ['treasury-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['pass-batches'] });
      queryClient.invalidateQueries({ queryKey: ['passes-summary'] });
      queryClient.invalidateQueries({ queryKey: ['pass-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      const batchNo = data?.batch?.batchNo ? ` (Batch: ${data.batch.batchNo})` : '';
      toast.success(`✓ Withdrawn ${data?.batch?.totalPasses || ''} passes from Treasury${batchNo}`);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to withdraw passes from treasury';
      toast.error(msg);
    }
  });

  const withdrawPasses = useCallback(
    (passes, note) => {
      return withdrawMutation.mutateAsync({ passes, note });
    },
    [withdrawMutation]
  );

  return {
    treasuryLedger,
    treasuryStats,
    balance: treasuryStats.balance,
    withdrawPasses,
    isLoading: summaryQuery.isLoading || ledgerQuery.isLoading,
    isError: summaryQuery.isError || ledgerQuery.isError,
    error: summaryQuery.error || ledgerQuery.error,
    refetch: () => {
      summaryQuery.refetch();
      ledgerQuery.refetch();
    }
  };
}
