import { create } from 'zustand';
import api from '../lib/api';

interface DashboardStats {
  total_revenue: number;
  new_clients: number;
  pipeline_value: number;
  conversion_rate: number;
  recent_activities: any[];
}

interface DashboardStore {
  stats: DashboardStats;
  isLoading: boolean;
  fetchStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  stats: {
    total_revenue: 0,
    new_clients: 0,
    pipeline_value: 0,
    conversion_rate: 0,
    recent_activities: []
  },
  isLoading: false,

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      // In a real app, you might have a dedicated analytics endpoint
      // For now, we'll fetch clients and opportunities to calculate stats
      const [clientsRes, oppsRes] = await Promise.all([
        api.get('/clients/'),
        api.get('/opportunities/')
      ]);

      const opps = oppsRes.data;
      const pipeline_value = opps.reduce((acc: number, curr: any) => acc + parseFloat(curr.montant_estime), 0);
      const won_opps = opps.filter((o: any) => o.statut === 'GAGNE');
      const total_revenue = won_opps.reduce((acc: number, curr: any) => acc + parseFloat(curr.montant_estime), 0);
      
      set({ 
        stats: {
          total_revenue,
          new_clients: clientsRes.data.length,
          pipeline_value,
          conversion_rate: opps.length > 0 ? (won_opps.length / opps.length) * 100 : 0,
          recent_activities: [] // Could fetch logs here
        },
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
      set({ isLoading: false });
    }
  }
}));
