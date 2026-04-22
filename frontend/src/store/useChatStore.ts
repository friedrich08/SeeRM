import { create } from 'zustand';
import api from '../lib/api';

interface Message {
  id?: number;
  content: string;
  is_from_prospect: boolean;
  timestamp: string;
  sender_id?: number;
}

interface Conversation {
  id: number;
  client_detail: { nom_societe: string };
  messages: Message[];
}

interface ChatStore {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  isLoading: boolean;
  fetchConversations: () => Promise<void>;
  setActiveConversation: (id: number) => void;
  addMessageToActive: (message: Message) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversation: null,
  isLoading: false,

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      // We'll create a simple endpoint for this
      const response = await api.get('/conversations/');
      set({ conversations: response.data, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },

  setActiveConversation: (id) => {
    const conv = get().conversations.find(c => c.id === id) || null;
    set({ activeConversation: conv });
  },

  addMessageToActive: (message) => {
    const active = get().activeConversation;
    if (active) {
      const updatedActive = {
        ...active,
        messages: [...active.messages, message]
      };
      set({ 
        activeConversation: updatedActive,
        conversations: get().conversations.map(c => c.id === active.id ? updatedActive : c)
      });
    }
  }
}));
