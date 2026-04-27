import { create } from 'zustand';
import api, { setLogoutCallback } from '../lib/api';

type AuthUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role: 'ADMIN' | 'MANAGER' | 'SALES' | 'FINANCE' | 'SUPPORT' | 'CLIENT';
  client_link?: number;
  permissions?: Record<string, Record<string, boolean>>;
};

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  initAuth: () => Promise<void>;
  completeSocialAuth: (access: string, refresh: string) => Promise<void>;
  can: (module: string, action: string) => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: !!localStorage.getItem('token'),
  error: null,

  initAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }
    
    // Si on a un token mais pas encore d'utilisateur, on le récupère impérativement
    try {
      set({ isLoading: true });
      await get().fetchMe();
    } catch (error) {
      console.error("Erreur lors de l'initialisation de l'auth:", error);
      // En cas d'erreur critique (401), fetchMe appellera logout() via l'intercepteur
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login/', { email, password });
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      set({ token: response.data.access, isAuthenticated: true });
      await get().fetchMe();
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Identifiants invalides', isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register/', data);
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      set({ token: response.data.access, isAuthenticated: true, user: response.data.user });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Erreur lors de l\'inscription', isLoading: false });
    }
  },

  fetchMe: async () => {
    try {
      const response = await api.get('/auth/me/');
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  completeSocialAuth: async (access, refresh) => {
    localStorage.setItem('token', access);
    localStorage.setItem('refresh_token', refresh);
    set({ token: access, isAuthenticated: true });
    await get().fetchMe();
  },

  can: (module, action) => {
    const user = get().user;
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return !!user.permissions?.[module]?.[action];
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false, error: null, token: null, isLoading: false });
  },
}));

// Enregistrer le callback de déconnexion pour l'intercepteur API
setLogoutCallback(() => {
  useAuthStore.getState().logout();
});
