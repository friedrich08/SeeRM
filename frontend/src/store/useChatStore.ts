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
  addMessageToConversation: (conversationId: number, message: Message) => void;
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

  addMessageToConversation: (conversationId, message) => {
    const conversations = get().conversations;
    const target = conversations.find((conversation) => conversation.id === conversationId);
    if (!target) {
      return;
    }

    const lastMessage = target.messages[target.messages.length - 1];
    const isDuplicate =
      !!lastMessage &&
      lastMessage.content === message.content &&
      lastMessage.is_from_prospect === message.is_from_prospect &&
      lastMessage.sender_id === message.sender_id;

    if (isDuplicate) {
      return;
    }

    const updatedConversation = {
      ...target,
      messages: [...target.messages, message],
    };
    const reordered = [
      updatedConversation,
      ...conversations.filter((conversation) => conversation.id !== conversationId),
    ];

    set({
      conversations: reordered,
      activeConversation: get().activeConversation?.id === conversationId ? updatedConversation : get().activeConversation,
    });
  },
}));
