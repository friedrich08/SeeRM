import { create } from 'zustand';
import api from '../lib/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/notifications/');
      const notifications = response.data;
      const unreadCount = notifications.filter((n: Notification) => !n.is_read).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/`, { is_read: true });
      const notifications = get().notifications.map(n => n.id === id ? { ...n, is_read: true } : n);
      const unreadCount = notifications.filter(n => !n.is_read).length;
      set({ notifications, unreadCount });
    } catch (error) {
      console.error(error);
    }
  }
}));
