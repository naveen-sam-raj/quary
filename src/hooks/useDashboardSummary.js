import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';

export function useDashboardSummary(from, to) {
  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary', { from: from || null, to: to || null }],
    queryFn: async () => {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await api.get('/dashboard/summary', { params });
      return res.data?.data;
    }
  });

  useEffect(() => {
    if (summaryQuery.isError) {
      const msg = summaryQuery.error?.response?.data?.message || 'Failed to load dashboard summary';
      toast.error(msg);
    }
  }, [summaryQuery.isError, summaryQuery.error]);

  return {
    data: summaryQuery.data,
    isLoading: summaryQuery.isLoading,
    isError: summaryQuery.isError,
    error: summaryQuery.error,
    refetch: summaryQuery.refetch
  };
}
