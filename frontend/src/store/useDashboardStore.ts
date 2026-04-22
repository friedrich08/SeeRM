import { create } from 'zustand';
import api from '../lib/api';

interface DashboardStats {
  kpi: {
    total_revenue: number;
    pipeline_value: number;
    new_clients: number;
    conversion_rate: number;
    active_opportunities: number;
  };
  revenue_trend: Array<{ month: string, revenue: number }>;
  opportunity_stats: Record<string, number>;
}

interface DashboardStore {
  stats: DashboardStats | null;
  isLoading: boolean;
  fetchStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  stats: null,
  isLoading: false,

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/dashboard-stats/');
      set({ stats: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
      set({ isLoading: false });
    }
  }
}));
