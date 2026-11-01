import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';

export const CATEGORY_MAP = {
  'JCB Rent': 'JCB',
  'Hitachi / Excavator Rent': 'Machinery',
  'Food Rent (Mess & Tea)': 'Food',
  'Tipper & Machinery Diesel': 'Diesel',
  'Explosives / Blasting': 'Blasting',
  'Crusher Maintenance': 'Machinery',
  'JCB': 'JCB',
  'Food': 'Food',
  'Machinery': 'Machinery',
  'Diesel': 'Diesel',
  'Blasting': 'Blasting',
  'Other': 'Other'
};

export function usePurchases() {
  const queryClient = useQueryClient();

  // 1. Fetch Purchases
  const purchasesQuery = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const res = await api.get('/purchases?limit=100');
      return res.data?.data || { items: [], categoryTotals: {} };
    }
  });

  const rawItems = purchasesQuery.data?.items || [];
  const categoryTotalsFromApi = purchasesQuery.data?.categoryTotals || {};

  // 2. Normalize Purchases
  const purchases = useMemo(() => {
    return rawItems.map((p) => {
      const dateStr = p.date ? p.date.split('T')[0] : '';
      let paymentMode = 'Cash';
      let description = p.notes || '';
      let notes = '';

      if (p.notes && p.notes.includes(' | ')) {
        const parts = p.notes.split(' | ');
        const modePart = parts.find((pt) => pt.startsWith('Mode: '));
        if (modePart) paymentMode = modePart.replace('Mode: ', '');
        const nonModes = parts.filter((pt) => !pt.startsWith('Mode: '));
        description = nonModes[0] || '';
        notes = nonModes.slice(1).join(' | ');
      }

      return {
        ...p,
        id: p._id,
        _id: p._id,
        date: dateStr,
        category: p.category || 'Other',
        vendor: p.vendor || '',
        amount: Number(p.amount || 0),
        description,
        notes,
        paymentMode
      };
    });
  }, [rawItems]);

  // Compute category stats
  const totalPurchaseAmount = useMemo(() => {
    return purchases.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  }, [purchases]);

  const purchaseCategoryStats = useMemo(() => {
    const categories = ['JCB', 'Machinery', 'Food', 'Diesel', 'Blasting'];
    return categories.map((cat) => {
      const catTotal = purchases
        .filter((p) => p.category === cat || p.category.includes(cat))
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const percentage =
        totalPurchaseAmount > 0 ? ((catTotal / totalPurchaseAmount) * 100).toFixed(1) : 0;
      return {
        category: cat,
        total: catTotal,
        percentage
      };
    });
  }, [purchases, totalPurchaseAmount]);

  // 3. Add Purchase Mutation
  const addPurchaseMutation = useMutation({
    mutationFn: async (purchaseData) => {
      const backendCategory = CATEGORY_MAP[purchaseData.category] || purchaseData.category || 'Other';
      const notesParts = [];
      if (purchaseData.description) notesParts.push(purchaseData.description.trim());
      if (purchaseData.notes && purchaseData.notes !== purchaseData.description) {
        notesParts.push(purchaseData.notes.trim());
      }
      if (purchaseData.paymentMode) notesParts.push(`Mode: ${purchaseData.paymentMode}`);

      const payload = {
        date: purchaseData.date || new Date().toISOString().split('T')[0],
        category: backendCategory,
        vendor: (purchaseData.vendor || '').trim(),
        amount: Number(purchaseData.amount || 0),
        notes: notesParts.join(' | ')
      };

      const res = await api.post('/purchases', payload);
      return res.data?.data?.purchase;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast.success(`✓ Recorded expense ₹${Number(data?.amount || 0).toLocaleString('en-IN')}`);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to record expense';
      toast.error(msg);
    }
  });

  // 4. Update Purchase Mutation
  const updatePurchaseMutation = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const backendCategory = CATEGORY_MAP[data.category] || data.category || 'Other';
      const notesParts = [];
      if (data.description) notesParts.push(data.description.trim());
      if (data.notes && data.notes !== data.description) notesParts.push(data.notes.trim());
      if (data.paymentMode) notesParts.push(`Mode: ${data.paymentMode}`);

      const payload = {
        date: data.date ? (data.date.includes('T') ? data.date.split('T')[0] : data.date) : undefined,
        category: backendCategory,
        vendor: data.vendor ? data.vendor.trim() : undefined,
        amount: data.amount !== undefined ? Number(data.amount) : undefined,
        notes: notesParts.length > 0 ? notesParts.join(' | ') : (data.notes || '')
      };

      const res = await api.put(`/purchases/${id}`, payload);
      return res.data?.data?.purchase;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast.success('✓ Expense record updated');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update expense';
      toast.error(msg);
    }
  });

  // 5. Delete Purchase Mutation
  const deletePurchaseMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/purchases/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast.success('Expense record deleted');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to delete expense';
      toast.error(msg);
    }
  });

  const addPurchase = useCallback(
    (purchaseData) => {
      return addPurchaseMutation.mutateAsync(purchaseData);
    },
    [addPurchaseMutation]
  );

  const updatePurchase = useCallback(
    (id, data) => {
      return updatePurchaseMutation.mutateAsync({ id, ...data });
    },
    [updatePurchaseMutation]
  );

  const deletePurchase = useCallback(
    (id) => {
      return deletePurchaseMutation.mutateAsync(id);
    },
    [deletePurchaseMutation]
  );

  return {
    purchases,
    purchaseCategoryStats,
    totalPurchaseAmount,
    addPurchase,
    updatePurchase,
    deletePurchase,
    isLoading: purchasesQuery.isLoading,
    isError: purchasesQuery.isError,
    error: purchasesQuery.error,
    refetch: () => purchasesQuery.refetch()
  };
}
