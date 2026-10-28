import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';

export function useLoads() {
  const queryClient = useQueryClient();

  // 1. Fetch Loads from API
  const loadsQuery = useQuery({
    queryKey: ['loads'],
    queryFn: async () => {
      const res = await api.get('/loads?limit=100');
      return res.data?.data?.items || [];
    }
  });

  const rawLoads = loadsQuery.data || [];

  // 2. Normalize Loads
  const loads = useMemo(() => {
    return rawLoads.map((load) => {
      const dateStr = load.date ? load.date.split('T')[0] : '';
      const agentName =
        load.agentName || (typeof load.agentId === 'object' ? load.agentId?.name : '') || 'Unknown Agent';
      const subBuyerName =
        load.subBuyerName || (typeof load.subBuyerId === 'object' ? load.subBuyerId?.name : '') || 'Direct / Unassigned';
      const batchNo =
        load.batchNo || (typeof load.passBatchId === 'object' ? load.passBatchId?.batchNo : '') || '';
      const passSource =
        typeof load.passBatchId === 'object' && load.passBatchId?.source ? load.passBatchId.source : 'govt';

      return {
        ...load,
        id: load._id,
        _id: load._id,
        date: dateStr,
        agentName,
        subBuyerName,
        material: load.material || '',
        units: Number(load.quantity || load.units || 1),
        lorryNo: load.lorryNo || '',
        passesUsed: 1,
        amount: Number(load.amount || 0),
        status: 'Paid',
        passSource,
        batchNo
      };
    });
  }, [rawLoads]);

  // 3. Add Load Mutation
  const addLoadMutation = useMutation({
    mutationFn: async (saleData) => {
      const payload = {
        date: saleData.date || new Date().toISOString().split('T')[0],
        lorryNo: (saleData.lorryNo || '').trim().toUpperCase(),
        material: (saleData.material || '').trim(),
        quantity: Number(saleData.units || saleData.quantity || 1),
        rate:
          Number(saleData.rate) ||
          (Number(saleData.amount || 0) / Number(saleData.units || saleData.quantity || 1)),
        amount: Number(saleData.amount || 0),
        agentId: saleData.agentId,
        subBuyerId: saleData.subBuyerId || undefined,
        notes: (saleData.notes || '').trim()
      };

      const res = await api.post('/loads', payload);
      return res.data?.data;
    },
    onSuccess: (data) => {
      // Invalidate loads, passes, treasury, and agents summary
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['passes'] });
      queryClient.invalidateQueries({ queryKey: ['pass-batches'] });
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      const lorry = data?.load?.lorryNo || '';
      const passInfo = data?.passFrom?.batchNo ? ` (Pass: ${data.passFrom.batchNo})` : '';
      toast.success(`✓ Sale dispatched for Lorry ${lorry}${passInfo}`);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to dispatch load';
      toast.error(msg);
    }
  });

  const addLoad = useCallback(
    (saleData) => {
      return addLoadMutation.mutateAsync(saleData);
    },
    [addLoadMutation]
  );

  return {
    loads,
    sales: loads, // alias for components expecting 'sales'
    addLoad,
    isLoading: loadsQuery.isLoading,
    isError: loadsQuery.isError,
    error: loadsQuery.error,
    refetch: () => loadsQuery.refetch()
  };
}
