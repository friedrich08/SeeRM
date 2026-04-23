import { useState, useEffect, useRef } from 'react';
import { Send, User, Search, Paperclip, MoreVertical, MessageSquare } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from '../lib/api';
import { useSearchParams } from 'react-router-dom';

const Chat = () => {
  const { user, can } = useAuthStore();
  const canWriteChat = can('chat', 'write');
  const { activeConversation, conversations, fetchConversations, setActiveConversation, addMessageToConversation } = useChatStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState('');
  const socketsRef = useRef<Record<number, WebSocket>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationIds = conversations.map((conversation) => conversation.id).join(',');

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const conversationId = Number(searchParams.get('conversation'));
    if (!conversationId || conversations.length === 0) {
      return;
    }
    if (conversations.some((conversation) => conversation.id === conversationId)) {
      setActiveConversation(conversationId);
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('conversation');
        return next;
      }, { replace: true });
    }
  }, [conversations, searchParams, setActiveConversation, setSearchParams]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || conversations.length === 0) return;
    const backendBase = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    const wsProtocol = backendBase.startsWith('https') ? 'wss' : 'ws';
    const host = backendBase.replace(/^https?:\/\//, '');
    const knownSockets = socketsRef.current;

    conversations.forEach((conversation) => {
      if (knownSockets[conversation.id]) {
        return;
      }
      const wsUrl = `${wsProtocol}://${host}/ws/chat/${conversation.id}/?token=${encodeURIComponent(token)}`;
      const socket = new WebSocket(wsUrl);
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        addMessageToConversation(conversation.id, {
          content: data.message,
          is_from_prospect: data.is_from_prospect,
          timestamp: new Date().toISOString(),
          sender_id: data.sender_id,
        });
      };
      socket.onclose = () => {
        delete socketsRef.current[conversation.id];
      };
      knownSockets[conversation.id] = socket;
    });

    Object.keys(knownSockets).forEach((key) => {
      const conversationId = Number(key);
      if (!conversations.some((conversation) => conversation.id === conversationId)) {
        knownSockets[conversationId]?.close();
        delete knownSockets[conversationId];
      }
    });

    return () => {
      Object.values(socketsRef.current).forEach((socket) => socket.close());
      socketsRef.current = {};
    };
  }, [conversationIds, addMessageToConversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages]);

  const sendMessage = () => {
    if (!canWriteChat || !input.trim() || !activeConversation) return;
    const socket = socketsRef.current[activeConversation.id];
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(
      JSON.stringify({
        message: input,
        sender_id: user?.id,
        is_from_prospect: false,
      })
    );
    setInput('');
  };

  return (
    <div className="h-[calc(100vh-120px)] flex bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-80 border-r border-gray-100 flex flex-col bg-bg-light/50">
        <div className="p-6 border-b border-gray-100 bg-white">
          <h2 className="text-xl font-bold mb-4">Conversations</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-accent/10 transition-all outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveConversation(conv.id)}
              className={`w-full p-4 flex gap-4 hover:bg-white transition-colors border-b border-gray-50/50 ${activeConversation?.id === conv.id ? 'bg-white shadow-sm z-10' : ''}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                <User size={24} />
              </div>
              <div className="text-left overflow-hidden">
                <p className="font-bold text-sm text-brand-primary truncate">{conv.client_detail.nom_societe}</p>
                <p className="text-xs text-brand-secondary truncate">{conv.messages[conv.messages.length - 1]?.content || 'Aucun message'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        {activeConversation ? (
          <>
            <header className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-brand-primary">{activeConversation.client_detail.nom_societe}</h3>
                  <p className="text-xs text-green-500 font-medium">Conversation active</p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                <MoreVertical size={20} />
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-bg-light/30 scroll-smooth">
              {activeConversation.messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.is_from_prospect ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${
                      msg.is_from_prospect ? 'bg-white text-brand-primary rounded-tl-none border border-gray-100' : 'bg-brand-primary text-white rounded-tr-none'
                    }`}
                  >
                    {msg.content}
                    <p className={`text-[10px] mt-1 opacity-60 ${msg.is_from_prospect ? 'text-gray-400' : 'text-white'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <footer className="p-6 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:border-brand-accent/30 focus-within:bg-white focus-within:shadow-md transition-all">
                <button className="p-2 text-gray-400 hover:text-brand-primary transition-colors">
                  <Paperclip size={20} />
                </button>
                <input
                  type="text"
                  placeholder="Ecrivez votre message..."
                  className="flex-1 bg-transparent border-none outline-none text-sm py-2 px-2"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={!canWriteChat}
                />
                <button
                  onClick={sendMessage}
                  disabled={!canWriteChat}
                  className="bg-brand-primary text-white p-2 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <MessageSquare size={40} className="text-gray-200" />
            </div>
            <h3 className="text-lg font-bold text-brand-primary mb-2">Vos conversations</h3>
            <p className="text-center max-w-xs text-sm">Selectionnez un client dans la liste pour commencer a discuter en temps reel.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
