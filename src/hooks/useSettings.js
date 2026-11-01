import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';

export const DEFAULT_SETTINGS = {
  defaultValidityDays: 30,
  warningDays: 7,
  lowStockLimit: 10
};

export function useSettings() {
  const queryClient = useQueryClient();

  // 1. Fetch Settings
  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data?.data?.settings || DEFAULT_SETTINGS;
    }
  });

  const settings = useMemo(() => {
    return {
      ...DEFAULT_SETTINGS,
      ...(settingsQuery.data || {})
    };
  }, [settingsQuery.data]);

  // 2. Update Settings Mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings) => {
      const payload = {
        defaultValidityDays: Number(newSettings.defaultValidityDays || DEFAULT_SETTINGS.defaultValidityDays),
        warningDays: Number(newSettings.warningDays || DEFAULT_SETTINGS.warningDays),
        lowStockLimit: Number(newSettings.lowStockLimit || DEFAULT_SETTINGS.lowStockLimit)
      };
      const res = await api.put('/settings', payload);
      return res.data?.data?.settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['pass-batches'] });
      queryClient.invalidateQueries({ queryKey: ['passes-summary'] });
      queryClient.invalidateQueries({ queryKey: ['pass-alerts'] });
      toast.success('✓ Pass rules, validity days & alert thresholds updated');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update settings';
      toast.error(msg);
    }
  });

  const updateSettings = useCallback(
    (newSettings) => {
      return updateSettingsMutation.mutateAsync(newSettings);
    },
    [updateSettingsMutation]
  );

  return {
    settings,
    updateSettings,
    isLoading: settingsQuery.isLoading,
    isError: settingsQuery.isError,
    error: settingsQuery.error,
    refetch: () => settingsQuery.refetch()
  };
}
