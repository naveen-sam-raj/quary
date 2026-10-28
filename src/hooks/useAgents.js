import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';

export function useAgents() {
  const queryClient = useQueryClient();

  // 1. Fetch Agents from API
  const agentsQuery = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await api.get('/agents?limit=100');
      return res.data?.data?.items || [];
    }
  });

  // 2. Fetch Sub-Buyers from API
  const subBuyersQuery = useQuery({
    queryKey: ['subbuyers'],
    queryFn: async () => {
      const res = await api.get('/subbuyers');
      return res.data?.data?.items || [];
    }
  });

  const rawAgents = agentsQuery.data || [];
  const rawSubBuyers = subBuyersQuery.data || [];

  // Build agent lookup map
  const agentMap = useMemo(() => {
    const map = {};
    rawAgents.forEach((a) => {
      map[a._id] = a;
    });
    return map;
  }, [rawAgents]);

  // Normalize sub-buyers
  const subBuyers = useMemo(() => {
    return rawSubBuyers.map((sb) => {
      const aid = typeof sb.agentId === 'object' && sb.agentId ? sb.agentId._id : sb.agentId;
      const aname =
        typeof sb.agentId === 'object' && sb.agentId
          ? sb.agentId.name
          : agentMap[aid]?.name || '';

      return {
        ...sb,
        id: sb._id,
        _id: sb._id,
        agentId: aid,
        agentName: aname,
        name: sb.name,
        phone: sb.phone || '',
        location: sb.location || ''
      };
    });
  }, [rawSubBuyers, agentMap]);

  // Normalize agents with capitalized status and subBuyers name list for backwards compatibility
  const agents = useMemo(() => {
    return rawAgents.map((agent) => {
      const currentSubs = subBuyers
        .filter((sb) => sb.agentId === agent._id)
        .map((sb) => sb.name);

      const normalizedStatus = agent.status
        ? agent.status.charAt(0).toUpperCase() + agent.status.slice(1).toLowerCase()
        : 'Active';

      return {
        ...agent,
        id: agent._id,
        _id: agent._id,
        status: normalizedStatus,
        subBuyers: currentSubs
      };
    });
  }, [rawAgents, subBuyers]);

  // --- MUTATIONS ---

  // Add Agent Mutation
  const addAgentMutation = useMutation({
    mutationFn: async (agentData) => {
      const payload = {
        name: agentData.name.trim(),
        phone: agentData.phone.trim(),
        company: agentData.company?.trim() || '',
        location: agentData.location?.trim() || '',
        commission: Number(agentData.commission) || 0,
        openingBalance: Number(agentData.openingBalance) || 0,
        status: (agentData.status || 'active').toLowerCase(),
        notes: agentData.notes?.trim() || ''
      };
      const res = await api.post('/agents', payload);
      return res.data?.data?.agent;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success(`Agent "${data?.name || ''}" created successfully`);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create agent';
      toast.error(msg);
    }
  });

  // Update Agent Mutation
  const updateAgentMutation = useMutation({
    mutationFn: async ({ id, updatedData }) => {
      const payload = {
        name: updatedData.name ? updatedData.name.trim() : undefined,
        phone: updatedData.phone ? updatedData.phone.trim() : undefined,
        company: updatedData.company !== undefined ? updatedData.company.trim() : undefined,
        location: updatedData.location !== undefined ? updatedData.location.trim() : undefined,
        commission: updatedData.commission !== undefined ? Number(updatedData.commission) : undefined,
        openingBalance: updatedData.openingBalance !== undefined ? Number(updatedData.openingBalance) : undefined,
        status: updatedData.status ? updatedData.status.toLowerCase() : undefined,
        notes: updatedData.notes !== undefined ? updatedData.notes.trim() : undefined
      };
      const res = await api.put(`/agents/${id}`, payload);
      return res.data?.data?.agent;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success(`Agent "${data?.name || ''}" updated successfully`);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update agent';
      toast.error(msg);
    }
  });

  // Toggle Status Mutation
  const toggleAgentStatusMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.patch(`/agents/${id}/status`);
      return res.data?.data?.agent;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      const nextStatus = data?.status === 'active' ? 'Active' : 'Inactive';
      toast.success(`Agent status changed to ${nextStatus}`);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to toggle status';
      toast.error(msg);
    }
  });

  // Delete Agent Mutation (Soft delete)
  const deleteAgentMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/agents/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['subbuyers'] });
      toast.success('Agent and sub-buyers removed');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to delete agent';
      toast.error(msg);
    }
  });

  // Add Sub-Buyer Mutation
  const addSubBuyerMutation = useMutation({
    mutationFn: async ({ agentId, agentName, name, phone, location }) => {
      // Resolve agentId if needed
      let targetAgentId = agentId;
      if (!targetAgentId && agentName) {
        const found = rawAgents.find((a) => a.name === agentName);
        if (found) targetAgentId = found._id;
      }

      if (!targetAgentId) {
        throw new Error('Please select an agent for this sub-buyer');
      }

      const payload = {
        agentId: targetAgentId,
        name: name.trim(),
        phone: phone ? phone.trim() : '',
        location: location ? location.trim() : ''
      };

      const res = await api.post('/subbuyers', payload);
      return res.data?.data?.subBuyer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subbuyers'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success(`Sub-buyer "${data?.name || ''}" added successfully`);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to add sub-buyer';
      toast.error(msg);
    }
  });

  // Stable handlers matching previous API shape
  const addAgent = useCallback(
    (agentData) => {
      return addAgentMutation.mutateAsync(agentData);
    },
    [addAgentMutation]
  );

  const updateAgent = useCallback(
    (id, updatedData) => {
      return updateAgentMutation.mutateAsync({ id, updatedData });
    },
    [updateAgentMutation]
  );

  const toggleAgentStatus = useCallback(
    (id) => {
      return toggleAgentStatusMutation.mutateAsync(id);
    },
    [toggleAgentStatusMutation]
  );

  const deleteAgent = useCallback(
    (id) => {
      return deleteAgentMutation.mutateAsync(id);
    },
    [deleteAgentMutation]
  );

  const addSubBuyer = useCallback(
    (subBuyerData) => {
      return addSubBuyerMutation.mutateAsync(subBuyerData);
    },
    [addSubBuyerMutation]
  );

  // Helper stats methods
  const getAgentStats = useCallback((agentName, sales = []) => {
    const agentSales = sales.filter((s) => s.agentName === agentName);
    const totalAmount = agentSales.reduce((acc, s) => acc + Number(s.amount || 0), 0);
    const totalLoads = agentSales.length;
    return {
      totalAmount,
      totalLoads,
      sales: agentSales
    };
  }, []);

  const getTopAgent = useCallback(
    (sales = []) => {
      let topName = null;
      let maxAmount = -1;

      agents
        .filter((a) => a.status === 'Active')
        .forEach((a) => {
          const stats = getAgentStats(a.name, sales);
          if (stats.totalAmount > maxAmount) {
            maxAmount = stats.totalAmount;
            topName = a.name;
          }
        });

      return topName;
    },
    [agents, getAgentStats]
  );

  return {
    agents,
    subBuyers,
    addAgent,
    updateAgent,
    deleteAgent,
    toggleAgentStatus,
    addSubBuyer,
    getAgentStats,
    getTopAgent,
    isLoading: agentsQuery.isLoading || subBuyersQuery.isLoading,
    isError: agentsQuery.isError || subBuyersQuery.isError,
    error: agentsQuery.error || subBuyersQuery.error,
    refetch: () => {
      agentsQuery.refetch();
      subBuyersQuery.refetch();
    }
  };
}
