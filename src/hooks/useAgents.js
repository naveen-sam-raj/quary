import { useState, useEffect, useCallback } from 'react';

const SEED_AGENTS = [
  {
    id: 'agent-1',
    name: 'Naveen',
    phone: '+91 98765 43210',
    company: 'Naveen Granites & Logistics',
    location: 'Namakkal',
    commission: 5,
    openingBalance: 50000,
    status: 'Active',
    notes: 'Primary agent handling central district dispatches',
    createdAt: '2026-10-01',
    subBuyers: ['Sam', 'Raj', 'Kumar', 'Bala']
  },
  {
    id: 'agent-2',
    name: 'Karthik',
    phone: '+91 94432 11223',
    company: 'Karthik Blue Metal Suppliers',
    location: 'Salem',
    commission: 4,
    openingBalance: 25000,
    status: 'Active',
    notes: 'Handles 20mm blue metal & GSB orders',
    createdAt: '2026-10-05',
    subBuyers: ['Mani', 'Surya', 'Vignesh']
  },
  {
    id: 'agent-3',
    name: 'Murugan Agencies',
    phone: '+91 98421 55667',
    company: 'Murugan Roadways & Crusher Agencies',
    location: 'Karur',
    commission: 4.5,
    openingBalance: 30000,
    status: 'Active',
    notes: 'Bulk M-Sand contractor',
    createdAt: '2026-10-10',
    subBuyers: ['Senthil', 'Prabhu']
  }
];

const SEED_SUB_BUYERS = [
  { id: 'sub-1', agentId: 'agent-1', agentName: 'Naveen', name: 'Sam', phone: '+91 98765 00001', location: 'Tiruchengode' },
  { id: 'sub-2', agentId: 'agent-1', agentName: 'Naveen', name: 'Raj', phone: '+91 98765 00002', location: 'Rasipuram' },
  { id: 'sub-3', agentId: 'agent-1', agentName: 'Naveen', name: 'Kumar', phone: '+91 98765 00003', location: 'Sankari' },
  { id: 'sub-4', agentId: 'agent-1', agentName: 'Naveen', name: 'Bala', phone: '+91 98765 00004', location: 'Mohanur' },
  { id: 'sub-5', agentId: 'agent-2', agentName: 'Karthik', name: 'Mani', phone: '+91 94432 00001', location: 'Attur' },
  { id: 'sub-6', agentId: 'agent-2', agentName: 'Karthik', name: 'Surya', phone: '+91 94432 00002', location: 'Mettur' },
  { id: 'sub-7', agentId: 'agent-2', agentName: 'Karthik', name: 'Vignesh', phone: '+91 94432 00003', location: 'Omalur' },
  { id: 'sub-8', agentId: 'agent-3', agentName: 'Murugan Agencies', name: 'Senthil', phone: '+91 98421 00001', location: 'Kulithalai' },
  { id: 'sub-9', agentId: 'agent-3', agentName: 'Murugan Agencies', name: 'Prabhu', phone: '+91 98421 00002', location: 'Aravakurichi' }
];

export const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
};

export function useAgents() {
  const [agents, setAgents] = useState(() => {
    try {
      const saved = localStorage.getItem('quarry_agents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load agents from localStorage', e);
    }
    return SEED_AGENTS;
  });

  const [subBuyers, setSubBuyers] = useState(() => {
    try {
      const saved = localStorage.getItem('quarry_subbuyers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load sub-buyers from localStorage', e);
    }
    return SEED_SUB_BUYERS;
  });

  // Persist agents
  useEffect(() => {
    try {
      localStorage.setItem('quarry_agents', JSON.stringify(agents));
    } catch (e) {
      console.warn('Failed to save agents to localStorage', e);
    }
  }, [agents]);

  // Persist sub-buyers
  useEffect(() => {
    try {
      localStorage.setItem('quarry_subbuyers', JSON.stringify(subBuyers));
    } catch (e) {
      console.warn('Failed to save sub-buyers to localStorage', e);
    }
  }, [subBuyers]);

  // Add Agent
  const addAgent = useCallback((agentData) => {
    const newAgent = {
      id: generateId(),
      name: agentData.name.trim(),
      phone: agentData.phone.trim(),
      company: agentData.company?.trim() || '',
      location: agentData.location?.trim() || '',
      commission: Number(agentData.commission) || 0,
      openingBalance: Number(agentData.openingBalance) || 0,
      status: agentData.status || 'Active',
      notes: agentData.notes?.trim() || '',
      createdAt: new Date().toISOString().split('T')[0],
      subBuyers: []
    };

    setAgents(prev => [newAgent, ...prev]);
    return newAgent;
  }, []);

  // Update Agent
  const updateAgent = useCallback((id, updatedData) => {
    setAgents(prev =>
      prev.map(agent => {
        if (agent.id === id) {
          return {
            ...agent,
            ...updatedData,
            name: updatedData.name ? updatedData.name.trim() : agent.name,
            phone: updatedData.phone ? updatedData.phone.trim() : agent.phone,
            company: updatedData.company !== undefined ? updatedData.company.trim() : agent.company,
            location: updatedData.location !== undefined ? updatedData.location.trim() : agent.location,
            commission: updatedData.commission !== undefined ? Number(updatedData.commission) : agent.commission,
            openingBalance: updatedData.openingBalance !== undefined ? Number(updatedData.openingBalance) : agent.openingBalance,
            status: updatedData.status || agent.status,
            notes: updatedData.notes !== undefined ? updatedData.notes.trim() : agent.notes
          };
        }
        return agent;
      })
    );
  }, []);

  // Delete / Soft Delete Agent
  const deleteAgent = useCallback((id, hasSales = false) => {
    if (hasSales) {
      // Soft delete: mark Inactive
      setAgents(prev =>
        prev.map(a => (a.id === id ? { ...a, status: 'Inactive' } : a))
      );
    } else {
      // Hard delete
      setAgents(prev => prev.filter(a => a.id !== id));
      setSubBuyers(prev => prev.filter(sb => sb.agentId !== id));
    }
  }, []);

  // Toggle status
  const toggleAgentStatus = useCallback((id) => {
    setAgents(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, status: a.status === 'Active' ? 'Inactive' : 'Active' }
          : a
      )
    );
  }, []);

  // Add Sub-Buyer
  const addSubBuyer = useCallback(({ agentId, agentName, name, phone, location }) => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    const newSub = {
      id: generateId(),
      agentId,
      agentName,
      name: trimmedName,
      phone: phone ? phone.trim() : '',
      location: location ? location.trim() : ''
    };

    setSubBuyers(prev => [...prev, newSub]);

    // Keep agent.subBuyers string array updated
    setAgents(prev =>
      prev.map(ag => {
        if (ag.id === agentId || ag.name === agentName) {
          const currentSubs = ag.subBuyers || [];
          if (!currentSubs.includes(trimmedName)) {
            return { ...ag, subBuyers: [...currentSubs, trimmedName] };
          }
        }
        return ag;
      })
    );

    return newSub;
  }, []);

  // Get Agent Stats from current sales array
  const getAgentStats = useCallback((agentName, sales = []) => {
    const agentSales = sales.filter(s => s.agentName === agentName);
    const totalAmount = agentSales.reduce((acc, s) => acc + Number(s.amount || 0), 0);
    const totalLoads = agentSales.length;
    return {
      totalAmount,
      totalLoads,
      sales: agentSales
    };
  }, []);

  // Calculate Top Agent
  const getTopAgent = useCallback((sales = []) => {
    let topName = null;
    let maxAmount = -1;

    agents
      .filter(a => a.status === 'Active')
      .forEach(a => {
        const stats = getAgentStats(a.name, sales);
        if (stats.totalAmount > maxAmount) {
          maxAmount = stats.totalAmount;
          topName = a.name;
        }
      });

    return topName;
  }, [agents, getAgentStats]);

  return {
    agents,
    setAgents,
    subBuyers,
    addAgent,
    updateAgent,
    deleteAgent,
    toggleAgentStatus,
    addSubBuyer,
    getAgentStats,
    getTopAgent
  };
}
