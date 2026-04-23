import { create } from 'zustand';
import api from '../lib/api';

export interface LigneArticle {
  designation: string;
  prix_unitaire: number;
  quantite: number;
  tva_taux?: number;
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
  fetchDevis: (clientId?: number) => Promise<void>;
  fetchFactures: (clientId?: number) => Promise<void>;
  createDevis: (payload: Partial<Devis>) => Promise<void>;
  createFacture: (payload: Partial<Facture>) => Promise<void>;
  acceptDevis: (id: number) => Promise<void>;
  downloadDevisPDF: (id: number, numero: string) => Promise<void>;
  downloadFacturePDF: (id: number, numero: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  devis: [],
  factures: [],
  isLoading: false,

  fetchDevis: async (clientId) => {
    set({ isLoading: true });
    try {
      const url = clientId ? `/devis/?client=${clientId}` : '/devis/';
      const response = await api.get(url);
      set({ devis: response.data, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },

  fetchFactures: async (clientId) => {
    set({ isLoading: true });
    try {
      const url = clientId ? `/factures/?client=${clientId}` : '/factures/';
      const response = await api.get(url);
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
      throw error;
    }
  },

  createFacture: async (payload) => {
    try {
      const response = await api.post('/factures/', payload);
      set((state) => ({ factures: [response.data, ...state.factures] }));
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  acceptDevis: async (id) => {
    try {
      const response = await api.post(`/devis/${id}/accept/`);
      set((state) => ({
        devis: state.devis.map((quote) => (quote.id === id ? response.data : quote)),
      }));
    } catch (error) {
      console.error(error);
      throw error;
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
