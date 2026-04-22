import { create } from 'zustand';
import api from '../lib/api';

interface Devis {
  id: number;
  numero: string;
  client_detail?: { nom_societe: string };
  date_emission: string;
  statut: string;
  total_ht: number;
  total_ttc: number;
}

interface FinanceStore {
  devis: Devis[];
  isLoading: boolean;
  fetchDevis: () => Promise<void>;
  downloadPDF: (id: number, numero: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  devis: [],
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

  downloadPDF: async (id, numero) => {
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
  }
}));
