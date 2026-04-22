import { create } from 'zustand';
import api from '../lib/api';

interface Contact {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone_direct: string;
  poste: string;
}

interface Client {
  id: number;
  nom_societe: string;
  siret: string;
  adresse: string;
  email_principal: string;
  telephone: string;
  type_client: 'PROSPECT' | 'CLIENT';
  contacts?: Contact[];
}

interface ClientStore {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  addClient: (client: Partial<Client>) => Promise<void>;
  updateClient: (id: number, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: number) => Promise<void>;
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  isLoading: false,
  error: null,

  fetchClients: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/clients/');
      set({ clients: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addClient: async (clientData) => {
    try {
      const response = await api.post('/clients/', clientData);
      set({ clients: [...get().clients, response.data] });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateClient: async (id, clientData) => {
    try {
      const response = await api.patch(`/clients/${id}/`, clientData);
      set({
        clients: get().clients.map(c => c.id === id ? response.data : c)
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteClient: async (id) => {
    try {
      await api.delete(`/clients/${id}/`);
      set({ clients: get().clients.filter(c => c.id !== id) });
    } catch (error: any) {
      set({ error: error.message });
    }
  }
}));
