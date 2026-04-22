import { useState, useEffect, useRef } from 'react';
import { Send, Briefcase, Paperclip, User, Building, Mail, Phone, MapPin, MessageSquare, Info, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';
import api from '../lib/api';
import { Logo } from '../components/ui/Logo';
import { useAuthStore } from '../store/useAuthStore';

const ClientPortal = () => {
  const user = useAuthStore(state => state.user);
  const [messages, setMessages] = useState<any[]>([]);
  const [client, setClient] = useState<any>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'profile'>('chat');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.client_link) return;
    
    // 1. Fetch client profile
    api.get(`/clients/${user.client_link}/`).then(res => setClient(res.data));

    // 2. Fetch or create conversation
    api.get('/conversations/').then(res => {
        // Filter conversations for this client
        const conv = res.data.find((c: any) => c.client === user.client_link);
        if (conv) {
            setConversationId(conv.id);
            setMessages(conv.messages || []);
        } else {
            // Create conversation if none exists
            api.post('/conversations/', { client: user.client_link }).then(newConv => {
                setConversationId(newConv.data.id);
            });
        }
    });
  }, [user]);

  useEffect(() => {
    if (!conversationId) return;
    
    const token = localStorage.getItem('token');
    const backendBase = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    const wsProtocol = backendBase.startsWith('https') ? 'wss' : 'ws';
    const host = backendBase.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}://${host}/ws/chat/${conversationId}/?token=${encodeURIComponent(token || '')}`;
    
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, {
        content: data.message,
        is_from_prospect: data.is_from_prospect,
        timestamp: new Date().toISOString(),
        sender_id: data.sender_id
      }]);
    };

    setSocket(ws);
    return () => ws.close();
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const sendMessage = () => {
    if (!socket || !input.trim()) return;
    socket.send(
      JSON.stringify({
        message: input,
        is_from_prospect: true,
      })
    );
    setInput('');
  };

  if (!user?.client_link) {
    return (
        <div className="min-h-screen flex items-center justify-center p-10 text-center">
            <div>
                <Logo size="lg" />
                <h2 className="text-xl font-bold mt-8 text-brand-primary">Accès restreint</h2>
                <p className="text-gray-500 mt-2">Votre compte n'est pas lié à une fiche client. Contactez l'administrateur.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] animate-in fade-in duration-500">
      <div className="w-full h-full bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col">
        <header className="bg-[#0b0f17] text-white p-6 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
                <Logo size="sm" showText={false} />
                <div>
                    <h2 className="font-bold text-lg leading-none">{client?.nom_societe || 'Chargement...'}</h2>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold">Portail Partenaire SeeRM</p>
                </div>
            </div>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'chat' ? 'bg-white text-[#0b0f17]' : 'text-gray-400 hover:text-white'}`}
                >
                    <MessageSquare size={14} /> Messagerie
                </button>
                <button 
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'bg-white text-[#0b0f17]' : 'text-gray-400 hover:text-white'}`}
                >
                    <User size={14} /> Profil
                </button>
            </div>
        </header>

        <div className="flex-1 overflow-hidden flex">
            {activeTab === 'chat' ? (
                <div className="flex-1 flex flex-col min-w-0">
                    <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-6 bg-gray-50/20">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.is_from_prospect ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-sm ${
                                    msg.is_from_prospect 
                                    ? 'bg-[#0b0f17] text-white rounded-tr-none' 
                                    : 'bg-white text-brand-primary rounded-tl-none border border-gray-100'
                                }`}>
                                    {msg.content}
                                    <p className={`text-[10px] mt-2 opacity-50 ${msg.is_from_prospect ? 'text-gray-400' : 'text-gray-400'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <footer className="p-6 border-t border-gray-100 bg-white">
                        <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:border-indigo-300 focus-within:bg-white transition-all">
                            <button className="p-2 text-gray-400 hover:text-[#0b0f17]">
                                <Paperclip size={20} />
                            </button>
                            <input
                                type="text"
                                placeholder="Ecrivez votre message ici..."
                                className="flex-1 bg-transparent border-none outline-none text-sm py-2"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <button
                                onClick={sendMessage}
                                className="bg-[#0b0f17] text-white p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </footer>
                </div>
            ) : (
                <div className="flex-1 p-10 overflow-y-auto bg-white">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex items-center gap-6 mb-10">
                            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-[#0b0f17] border border-gray-100">
                                <Building size={40} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-[#0b0f17]">{client?.nom_societe}</h3>
                                <p className="text-indigo-600 font-bold flex items-center gap-2 mt-1 uppercase text-[10px] tracking-widest">
                                    <ShieldCheck size={14} /> Partenaire Verifie SeeRM
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</label>
                                    <div className="text-sm font-medium p-3 bg-gray-50 rounded-xl border border-gray-100">{client?.email_principal}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Telephone</label>
                                    <div className="text-sm font-medium p-3 bg-gray-50 rounded-xl border border-gray-100">{client?.telephone || '—'}</div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Adresse</label>
                                <div className="text-sm font-medium p-3 bg-gray-50 rounded-xl border border-gray-100 min-h-[100px]">{client?.adresse}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
