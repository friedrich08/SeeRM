import { create } from 'zustand';
import api from '../lib/api';

type AuthUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'MANAGER' | 'SALES' | 'FINANCE' | 'SUPPORT';
  permissions: Record<string, { read: boolean; write: boolean }>;
};

type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  completeSocialAuth: (access: string, refresh: string) => Promise<void>;
  can: (module: string, action?: 'read' | 'write') => boolean;
  logout: () => void;
};

const persistTokens = (access?: string, refresh?: string) => {
  if (access) localStorage.setItem('token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh);
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('token'),
  error: null,

  initAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/auth/me/');
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login/', { email, password });
      persistTokens(response.data?.access, response.data?.refresh);
      const me = await api.get('/auth/me/');
      set({ user: me.data, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error: any) {
      set({
        error: error?.response?.data?.detail || 'Echec de connexion.',
        isLoading: false,
        isAuthenticated: false,
      });
      return false;
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register/', payload);
      persistTokens(response.data?.access, response.data?.refresh);
      const me = await api.get('/auth/me/');
      set({ user: me.data, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error: any) {
      set({
        error: error?.response?.data?.detail || 'Echec de creation du compte.',
        isLoading: false,
        isAuthenticated: false,
      });
      return false;
    }
  },

  completeSocialAuth: async (access, refresh) => {
    persistTokens(access, refresh);
    set({ isLoading: true, error: null });
    try {
      const me = await api.get('/auth/me/');
      set({ user: me.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  can: (module, action = 'read') => {
    const user = get().user;
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return !!user.permissions?.[module]?.[action];
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false, error: null });
  },
}));
