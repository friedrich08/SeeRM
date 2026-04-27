import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Trash2,
} from 'lucide-react';

const Clients = () => {
  const can = useAuthStore((state) => state.can);
  const canWriteClients = can('clients', 'write');
  const navigate = useNavigate();
  const { clients, isLoading, fetchClients, deleteClient } = useClientStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = clients.filter(
    (client) =>
      client.nom_societe.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email_principal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-bold">Gestion des Clients</h1>
          <p className="text-brand-secondary">Consultez et gerez votre base de donnees clients et prospects.</p>
        </div>
        {canWriteClients && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 font-medium text-white shadow-lg shadow-brand-primary/20 transition-transform hover:scale-105 active:scale-95"
          >
            <Plus size={18} />
            Nouveau Client
          </button>
        )}
      </header>

      {canWriteClients && <ClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}

      <div className="mb-6 flex gap-4">
        <div className="relative w-full flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher une societe, un email..."
            className="w-full rounded-xl border border-gray-100 bg-white py-2.5 pl-10 pr-4 shadow-sm transition-all focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-bg-light">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">Societe</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">Type</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">Contacts</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">Contact Principal</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">Telephone</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">SIRET</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-brand-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-brand-primary" />
                  </td>
                </tr>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id} className="group transition-colors hover:bg-gray-50/50">
                    <td className="cursor-pointer px-6 py-4" onClick={() => navigate(`/clients/${client.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-white overflow-hidden">
                          {client.avatar_url ? (
                            <img src={client.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 size={20} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-brand-primary hover:underline">{client.nom_societe}</p>
                          <p className="text-xs text-gray-400">{client.adresse || "Pas d'adresse"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${
                          client.type_client === 'CLIENT' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {client.type_client}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-brand-primary/5 px-2 py-1 text-xs font-bold text-brand-primary">
                        {client.contacts?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-brand-primary">
                          <Mail size={14} className="text-gray-400" />
                          {client.contacts?.[0]
                            ? `${client.contacts[0].prenom} ${client.contacts[0].nom}`
                            : client.email_principal}
                        </div>
                        <div className="text-xs text-gray-500">{client.contacts?.[0]?.email || client.email_principal}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-brand-primary">
                        <Phone size={14} className="text-gray-400" />
                        {client.telephone || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-400">{client.siret || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/clients/${client.id}`)}
                          className="rounded-lg border border-transparent p-2 text-gray-400 transition-all hover:border-gray-100 hover:bg-white hover:text-brand-primary hover:shadow-sm"
                        >
                          <ExternalLink size={18} />
                        </button>
                        {canWriteClients && (
                          <button
                            onClick={() => {
                              if (confirm('Supprimer ce client ?')) deleteClient(client.id);
                            }}
                            className="rounded-lg border border-transparent p-2 text-gray-400 transition-all hover:border-gray-100 hover:bg-white hover:text-red-600 hover:shadow-sm"
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
                  <td colSpan={7} className="px-6 py-10 text-center italic text-gray-400">
                    Aucun client trouve.
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
