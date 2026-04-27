import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, User, Building, MessageSquare, ShieldCheck, FileCheck2, Download, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';
import api from '../lib/api';
import { Logo } from '../components/ui/Logo';
import { useAuthStore } from '../store/useAuthStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatXOF } from '../lib/currency';

const ClientPortal = () => {
  const { user, fetchMe } = useAuthStore();
  const { devis, factures, fetchDevis, fetchFactures, acceptDevis, downloadDevisPDF, downloadFacturePDF } = useFinanceStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [client, setClient] = useState<any>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'documents' | 'profile'>('chat');
  const [financeMessage, setFinanceMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ nom_societe: '', telephone: '', adresse: '' });
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.client_link) return;

    api.get(`/clients/${user.client_link}/`).then((res) => {
      setClient(res.data);
      setEditData({
        nom_societe: res.data.nom_societe,
        telephone: res.data.telephone || '',
        adresse: res.data.adresse || '',
      });
    });
    fetchDevis(user.client_link);
    fetchFactures(user.client_link);

    api.get('/conversations/').then((res) => {
      const conv = res.data.find((conversation: any) => conversation.client === user.client_link);
      if (conv) {
        setConversationId(conv.id);
        setMessages(conv.messages || []);
      } else {
        api.post('/conversations/', { client: user.client_link }).then((newConv) => {
          setConversationId(newConv.data.id);
        });
      }
    });
  }, [user, fetchDevis, fetchFactures]);

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
      setMessages((prev) => [
        ...prev,
        {
          content: data.message,
          is_from_prospect: data.is_from_prospect,
          timestamp: new Date().toISOString(),
          sender_id: data.sender_id,
        },
      ]);
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

  const handleAcceptDevis = async (id: number) => {
    setFinanceMessage('');
    try {
      await acceptDevis(id);
      setFinanceMessage('Le devis a ete accepte. Votre equipe CRM en sera informee.');
    } catch {
      setFinanceMessage("Impossible d'accepter ce devis pour le moment.");
    }
  };

  const handleUpdateClient = async () => {
    if (!user?.client_link) return;
    setProfileMessage({ text: '', type: '' });
    try {
      const res = await api.patch(`/clients/${user.client_link}/`, editData);
      setClient(res.data);
      setIsEditing(false);
      setProfileMessage({ text: 'Informations mises à jour avec succès.', type: 'success' });
    } catch (error: any) {
      setProfileMessage({ 
        text: error?.response?.data?.detail || "Erreur lors de la mise à jour des informations.", 
        type: 'error' 
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setIsUploading(true);
    setProfileMessage({ text: '', type: '' });
    try {
      await api.post('/auth/upload-avatar/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await fetchMe();
      setProfileMessage({ text: 'Photo mise à jour avec succès.', type: 'success' });
    } catch (error: any) {
      setProfileMessage({ 
        text: error?.response?.data?.detail || "Erreur lors de l'upload de la photo.", 
        type: 'error' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!user?.client_link) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10 text-center">
        <div>
          <Logo size="lg" />
          <h2 className="text-xl font-bold mt-8 text-brand-primary">Acces restreint</h2>
          <p className="text-gray-500 mt-2">Votre compte n'est pas lie a une fiche client. Contactez l'administrateur.</p>
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
              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold">Portail partenaire SeeRM</p>
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
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'documents' ? 'bg-white text-[#0b0f17]' : 'text-gray-400 hover:text-white'}`}
            >
              <FileCheck2 size={14} /> Documents
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
                    <div
                      className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-sm ${
                        msg.is_from_prospect ? 'bg-[#0b0f17] text-white rounded-tr-none' : 'bg-white text-brand-primary rounded-tl-none border border-gray-100'
                      }`}
                    >
                      {msg.content}
                      <p className="text-[10px] mt-2 opacity-50 text-gray-400">
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
                  <button onClick={sendMessage} className="bg-[#0b0f17] text-white p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all">
                    <Send size={20} />
                  </button>
                </div>
              </footer>
            </div>
          ) : activeTab === 'documents' ? (
            <div className="flex-1 p-10 overflow-y-auto bg-white">
              <div className="max-w-5xl mx-auto space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-[#0b0f17]">Documents commerciaux</h3>
                  <p className="mt-2 text-sm text-gray-500">Consultez vos devis et factures, telechargez-les, puis acceptez un devis lorsqu'il est valide.</p>
                </div>

                {financeMessage && <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{financeMessage}</div>}

                <section className="rounded-3xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 bg-gray-50 border-b border-gray-100">
                    <h4 className="font-bold text-brand-primary">Devis</h4>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {devis.length > 0 ? (
                      devis.map((quote) => (
                        <div key={quote.id} className="px-6 py-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="font-mono text-sm font-bold text-brand-primary">{quote.numero}</p>
                            <p className="text-sm text-gray-500 mt-1">Emis le {new Date(quote.date_emission).toLocaleDateString('fr-FR')} • {formatXOF(Number(quote.total_ttc))}</p>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400 mt-2">{quote.statut}</p>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => downloadDevisPDF(quote.id, quote.numero)}
                              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-brand-primary"
                            >
                              <Download size={16} />
                              Telecharger
                            </button>
                            {quote.statut !== 'ACCEPTE' && quote.statut !== 'REFUSE' && (
                              <button
                                onClick={() => handleAcceptDevis(quote.id)}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-600/20"
                              >
                                <FileCheck2 size={16} />
                                Accepter le devis
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-10 text-sm text-gray-400 italic">Aucun devis disponible.</div>
                    )}
                  </div>
                </section>

                <section className="rounded-3xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 bg-gray-50 border-b border-gray-100">
                    <h4 className="font-bold text-brand-primary">Factures</h4>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {factures.length > 0 ? (
                      factures.map((invoice) => (
                        <div key={invoice.id} className="px-6 py-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="font-mono text-sm font-bold text-brand-primary">{invoice.numero}</p>
                            <p className="text-sm text-gray-500 mt-1">Emise le {new Date(invoice.date_emission).toLocaleDateString('fr-FR')} • {formatXOF(Number(invoice.total_ttc))}</p>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400 mt-2">{invoice.statut}</p>
                          </div>
                          <button
                            onClick={() => downloadFacturePDF(invoice.id, invoice.numero)}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-brand-primary"
                          >
                            <Download size={16} />
                            Telecharger
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-10 text-sm text-gray-400 italic">Aucune facture disponible.</div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-10 overflow-y-auto bg-white">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-6 mb-10">
                  <div className="relative group">
                    <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center text-[#0b0f17] border border-indigo-100 overflow-hidden shadow-inner">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <Building size={48} className="text-indigo-300" />
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[2px]">
                          <Loader2 size={24} className="text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-gray-100 text-indigo-600 hover:scale-110 active:scale-95 transition-all"
                    >
                      <Upload size={16} />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editData.nom_societe}
                          onChange={(e) => setEditData({...editData, nom_societe: e.target.value})}
                          className="text-2xl font-bold text-[#0b0f17] border-b border-indigo-300 outline-none bg-indigo-50/30 px-2 rounded-t-lg"
                        />
                      ) : (
                        <h3 className="text-2xl font-bold text-[#0b0f17]">{client?.nom_societe}</h3>
                      )}
                      
                      {!isEditing ? (
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-all uppercase tracking-widest"
                        >
                          Modifier
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button 
                            onClick={handleUpdateClient}
                            className="text-[10px] font-bold text-white bg-green-600 px-2 py-1 rounded-lg hover:bg-green-700 transition-all uppercase tracking-widest"
                          >
                            Enregistrer
                          </button>
                          <button 
                            onClick={() => {
                              setIsEditing(false);
                              setEditData({
                                nom_societe: client.nom_societe,
                                telephone: client.telephone || '',
                                adresse: client.adresse || '',
                              });
                            }}
                            className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg hover:bg-gray-200 transition-all uppercase tracking-widest"
                          >
                            Annuler
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-indigo-600 font-bold flex items-center gap-2 mt-1 uppercase text-[10px] tracking-widest">
                      <ShieldCheck size={14} /> Partenaire verifie SeeRM
                    </p>
                    {profileMessage.text && (
                      <p className={`text-[10px] mt-2 font-bold ${profileMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {profileMessage.text}
                      </p>
                    )}
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
                      {isEditing ? (
                        <input 
                          type="text"
                          value={editData.telephone}
                          onChange={(e) => setEditData({...editData, telephone: e.target.value})}
                          className="w-full text-sm font-medium p-3 bg-white rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500/10"
                        />
                      ) : (
                        <div className="text-sm font-medium p-3 bg-gray-50 rounded-xl border border-gray-100">{client?.telephone || '—'}</div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Adresse</label>
                    {isEditing ? (
                      <textarea 
                        value={editData.adresse}
                        onChange={(e) => setEditData({...editData, adresse: e.target.value})}
                        className="w-full text-sm font-medium p-3 bg-white rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500/10 min-h-[100px]"
                      />
                    ) : (
                      <div className="text-sm font-medium p-3 bg-gray-50 rounded-xl border border-gray-100 min-h-[100px]">{client?.adresse}</div>
                    )}
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
