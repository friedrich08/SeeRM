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

interface ClientNote {
  id: number;
  client: number;
  content: string;
  author?: number | null;
  author_email?: string;
  created_at: string;
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
  notes?: ClientNote[];
}

interface ClientStore {
  clients: Client[];
  currentClient: Client | null;
  isLoading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  fetchClient: (id: number) => Promise<void>;
  addClient: (client: Partial<Client>) => Promise<void>;
  updateClient: (id: number, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: number) => Promise<void>;
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  currentClient: null,
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

  fetchClient: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/clients/${id}/`);
      set({ currentClient: response.data, isLoading: false });
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
        clients: get().clients.map(c => c.id === id ? response.data : c),
        currentClient: get().currentClient?.id === id ? response.data : get().currentClient,
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
