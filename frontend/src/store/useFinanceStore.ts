import { create } from 'zustand';
import api from '../lib/api';

export interface LigneArticle {
  designation: string;
  prix_unitaire: number;
  quantite: number;
}

export interface Devis {
  id: number;
  numero: string;
  client_detail?: { nom_societe: string };
  client?: number;
  date_emission: string;
  date_echeance?: string;
  statut: string;
  total_ht: number;
  total_ttc: number;
  notes?: string;
  lignes?: LigneArticle[];
}

export interface Facture {
  id: number;
  numero: string;
  client_detail?: { nom_societe: string };
  client?: number;
  devis_origine?: number;
  date_emission: string;
  date_echeance?: string;
  statut: string;
  total_ht: number;
  total_ttc: number;
  notes?: string;
  lignes?: LigneArticle[];
}

interface FinanceStore {
  devis: Devis[];
  factures: Facture[];
  isLoading: boolean;
  fetchDevis: () => Promise<void>;
  fetchFactures: () => Promise<void>;
  createDevis: (payload: Partial<Devis>) => Promise<void>;
  createFacture: (payload: Partial<Facture>) => Promise<void>;
  downloadDevisPDF: (id: number, numero: string) => Promise<void>;
  downloadFacturePDF: (id: number, numero: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  devis: [],
  factures: [],
  isLoading: false,

  fetchDevis: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/devis/');
      set({ devis: response.data, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },

  fetchFactures: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/factures/');
      set({ factures: response.data, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },

  createDevis: async (payload) => {
    try {
      const response = await api.post('/devis/', payload);
      set((state) => ({ devis: [response.data, ...state.devis] }));
    } catch (error) {
      console.error(error);
    }
  },

  createFacture: async (payload) => {
    try {
      const response = await api.post('/factures/', payload);
      set((state) => ({ factures: [response.data, ...state.factures] }));
    } catch (error) {
      console.error(error);
    }
  },

  downloadDevisPDF: async (id, numero) => {
    try {
      const response = await api.get(`/devis/${id}/pdf/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `devis_${numero}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed', error);
    }
  },

  downloadFacturePDF: async (id, numero) => {
    try {
      const response = await api.get(`/factures/${id}/pdf/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture_${numero}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed', error);
    }
  }
}));
