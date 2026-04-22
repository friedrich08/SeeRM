import { useEffect, useState } from 'react';
import { useClientStore } from '../store/useClientStore';
import { ClientModal } from '../components/ui/ClientModal';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Building2,
  ExternalLink,
  Trash2
} from 'lucide-react';

const Clients = () => {
  const can = useAuthStore((state) => state.can);
  const canWriteClients = can('clients', 'write');
  const { clients, isLoading, fetchClients, deleteClient } = useClientStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = clients.filter(client => 
    client.nom_societe.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email_principal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-1">Gestion des Clients</h1>
          <p className="text-brand-secondary">Consultez et gérez votre base de données clients et prospects.</p>
        </div>
        {canWriteClients && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-primary text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-brand-primary/20 hover:scale-105 transition-transform active:scale-95 flex items-center gap-2"
          >
            <Plus size={18} />
            Nouveau Client
          </button>
        )}
      </header>

      {canWriteClients && <ClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}

      {/* Filters & Search */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher une société, un email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-light border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">Société</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">Type</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">Contact Principal</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">Téléphone</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">SIRET</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
                  </td>
                </tr>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-brand-primary">{client.nom_societe}</p>
                          <p className="text-xs text-gray-400">{client.adresse || 'Pas d\'adresse'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                        client.type_client === 'CLIENT' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {client.type_client}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm text-brand-primary font-medium">
                          <Mail size={14} className="text-gray-400" />
                          {client.email_principal}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-brand-primary">
                        <Phone size={14} className="text-gray-400" />
                        {client.telephone || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                      {client.siret || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-brand-primary hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-100 shadow-none hover:shadow-sm">
                          <ExternalLink size={18} />
                        </button>
                        {canWriteClients && (
                          <button 
                            onClick={() => { if(confirm('Supprimer ce client ?')) deleteClient(client.id) }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-100 shadow-none hover:shadow-sm"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400 italic">
                    Aucun client trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Clients;
