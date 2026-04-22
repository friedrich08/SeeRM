import { create } from 'zustand';
import api from '../lib/api';

interface Opportunity {
  id: string;
  titre: string;
  client_detail?: { nom_societe: string };
  montant_estime: number;
  statut: string;
  priorite: string;
  date_echeance: string;
}

interface PipelineStore {
  opportunities: Opportunity[];
  isLoading: boolean;
  error: string | null;
  fetchOpportunities: () => Promise<void>;
  updateOpportunityStatus: (id: string, newStatus: string) => Promise<void>;
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
