import { useEffect, useState, useMemo } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { Bell, CheckCircle2, Clock, ExternalLink, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const Notifications = () => {
  const { notifications, fetchNotifications, markAsRead, isLoading } = useNotificationStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [notifications, searchTerm]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-1">Notifications</h1>
          <p className="text-brand-secondary">Restez informe des activites de vos prospects et de votre équipe.</p>
        </div>
      </header>

      <div className="mb-6">
        <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Rechercher une notification..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white p-10 rounded-3xl border border-gray-100 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((n) => (
            <div 
              key={n.id} 
              className={`bg-white p-5 rounded-2xl border transition-all flex items-start gap-4 ${n.is_read ? 'border-gray-100 opacity-60' : 'border-indigo-100 shadow-sm shadow-indigo-50'}`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${n.is_read ? 'bg-gray-50 text-gray-400' : 'bg-indigo-50 text-indigo-600'}`}>
                <Bell size={20} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                    <h3 className={`font-bold text-brand-primary ${n.is_read ? '' : 'text-indigo-900'}`}>{n.title}</h3>
                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-wider">
                        <Clock size={10} />
                        {new Date(n.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{n.message}</p>
                <div className="mt-4 flex items-center gap-4">
                    {n.link && (
                        <Link to={n.link} className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1">
                            Voir le detail <ExternalLink size={12} />
                        </Link>
                    )}
                    {!n.is_read && (
                        <button 
                            onClick={() => markAsRead(n.id)}
                            className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1"
                        >
                            <CheckCircle2 size={12} /> Marquer comme lu
                        </button>
                    )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-10 rounded-3xl border border-gray-100 text-center text-gray-400 italic">
            Aucune notification trouvée.
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
