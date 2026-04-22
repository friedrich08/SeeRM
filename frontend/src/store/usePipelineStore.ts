import { create } from 'zustand';
import api from '../lib/api';

interface Opportunity {
  id: number;
  titre: string;
  client_detail?: { nom_societe: string };
  montant_estime: number;
  statut: string;
  priorite: string;
  date_echeance: string;
  client?: number;
  description?: string;
}

interface PipelineStore {
  opportunities: Opportunity[];
  isLoading: boolean;
  error: string | null;
  fetchOpportunities: () => Promise<void>;
  fetchOpportunitiesByClient: (clientId: number) => Promise<void>;
  addOpportunity: (payload: Partial<Opportunity>) => Promise<void>;
  updateOpportunityStatus: (id: number, newStatus: string) => Promise<void>;
}

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  opportunities: [],
  isLoading: false,
  error: null,

  fetchOpportunities: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/opportunities/');
      set({ opportunities: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchOpportunitiesByClient: async (clientId) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/opportunities/?client=${clientId}`);
      set({ opportunities: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addOpportunity: async (payload) => {
    try {
      const response = await api.post('/opportunities/', payload);
      set({ opportunities: [response.data, ...get().opportunities] });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateOpportunityStatus: async (id, newStatus) => {
    try {
      await api.patch(`/opportunities/${id}/`, { statut: newStatus });
      // Optimistic update
      set({
        opportunities: get().opportunities.map(opp => 
          opp.id === id ? { ...opp, statut: newStatus } : opp
        )
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  }
}));
