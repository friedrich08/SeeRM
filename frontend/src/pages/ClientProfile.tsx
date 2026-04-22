import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClientStore } from '../store/useClientStore';
import { usePipelineStore } from '../store/usePipelineStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Users, 
  TrendingUp, 
  FileText, 
  ArrowLeft,
  ChevronRight,
  Download,
  Calendar,
  CreditCard,
  Plus
} from 'lucide-react';

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentClient, fetchClient, isLoading: isClientLoading } = useClientStore();
  const { opportunities, fetchOpportunitiesByClient, isLoading: isOppLoading } = usePipelineStore();
  const { devis, factures, fetchDevis, fetchFactures, downloadDevisPDF, downloadFacturePDF, isLoading: isFinanceLoading } = useFinanceStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'opportunities' | 'finance'>('overview');

  useEffect(() => {
    if (id) {
      const clientId = parseInt(id);
      fetchClient(clientId);
      fetchOpportunitiesByClient(clientId);
      fetchDevis(clientId);
      fetchFactures(clientId);
    }
  }, [id, fetchClient, fetchOpportunitiesByClient, fetchDevis, fetchFactures]);

  if (isClientLoading && !currentClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!currentClient) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Client non trouvé.</p>
        <button onClick={() => navigate('/clients')} className="mt-4 text-brand-primary font-medium hover:underline flex items-center gap-2 mx-auto">
          <ArrowLeft size={16} /> Retour à la liste
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Aperçu', icon: Building2 },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'opportunities', label: 'Opportunités', icon: TrendingUp },
    { id: 'finance', label: 'Finance', icon: FileText },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="mb-8">
        <button 
          onClick={() => navigate('/clients')}
          className="group flex items-center gap-2 text-brand-secondary hover:text-brand-primary transition-colors mb-4"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Retour aux clients</span>
        </button>
        
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center text-brand-primary border border-brand-primary/10">
              <Building2 size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{currentClient.nom_societe}</h1>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                  currentClient.type_client === 'CLIENT' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {currentClient.type_client}
                </span>
              </div>
              <p className="text-brand-secondary flex items-center gap-2 mt-1">
                <Mail size={14} /> {currentClient.email_principal}
                <span className="text-gray-300">•</span>
                <Phone size={14} /> {currentClient.telephone || 'Non renseigné'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
             {/* Action buttons could go here */}
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="flex gap-1 mb-8 bg-gray-100/50 p-1 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-brand-primary shadow-sm' 
                : 'text-brand-secondary hover:text-brand-primary hover:bg-white/50'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Building2 size={20} className="text-brand-primary" />
                  Informations Générales
                </h3>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">SIRET</p>
                    <p className="font-mono text-brand-primary">{currentClient.siret || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email Principal</p>
                    <p className="text-brand-primary">{currentClient.email_principal}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Téléphone</p>
                    <p className="text-brand-primary">{currentClient.telephone || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Adresse</p>
                    <p className="text-brand-primary flex items-start gap-1">
                      <MapPin size={16} className="text-gray-300 mt-0.5 shrink-0" />
                      {currentClient.adresse || 'Non renseignée'}
                    </p>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Opportunités</p>
                  <p className="text-3xl font-bold text-brand-primary">{opportunities.length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Devis</p>
                  <p className="text-3xl font-bold text-brand-primary">{devis.length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Factures</p>
                  <p className="text-3xl font-bold text-brand-primary">{factures.length}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <section className="bg-brand-primary text-white p-8 rounded-3xl shadow-xl shadow-brand-primary/20 relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold mb-4">Valeur du compte</h3>
                    <p className="text-4xl font-bold mb-2">
                      {opportunities.reduce((acc, opp) => acc + (opp.statut === 'GAGNE' ? Number(opp.montant_estime) : 0), 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                    <p className="text-brand-primary-light text-sm opacity-80">Chiffre d'affaires total généré</p>
                  </div>
                  <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 -rotate-12" />
               </section>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold">Liste des contacts</h3>
              <button className="text-brand-primary text-sm font-bold flex items-center gap-1 hover:bg-brand-primary/5 px-3 py-1.5 rounded-lg transition-colors">
                <Plus size={16} /> Ajouter un contact
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-bg-light">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Nom</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Poste</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Email</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Téléphone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentClient.contacts && currentClient.contacts.length > 0 ? (
                    currentClient.contacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-brand-primary">
                          {contact.prenom} {contact.nom}
                        </td>
                        <td className="px-6 py-4 text-sm text-brand-secondary">{contact.poste || '—'}</td>
                        <td className="px-6 py-4 text-sm text-brand-primary">{contact.email}</td>
                        <td className="px-6 py-4 text-sm text-brand-secondary">{contact.telephone_direct || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">Aucun contact enregistré.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'opportunities' && (
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold">Opportunités commerciales</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-bg-light">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Titre</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Statut</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Montant</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary text-right">Échéance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {opportunities.length > 0 ? (
                    opportunities.map((opp) => (
                      <tr key={opp.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-brand-primary">{opp.titre}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            opp.statut === 'GAGNE' ? 'bg-green-50 text-green-600' : 
                            opp.statut === 'PERDU' ? 'bg-red-50 text-red-600' : 'bg-brand-primary/5 text-brand-primary'
                          }`}>
                            {opp.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-brand-primary">
                          {Number(opp.montant_estime).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </td>
                        <td className="px-6 py-4 text-sm text-brand-secondary text-right">
                          {opp.date_echeance ? new Date(opp.date_echeance).toLocaleDateString('fr-FR') : '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">Aucune opportunité en cours.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-6">
            <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <h3 className="text-lg font-bold">Devis</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-bg-light">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Numéro</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Date</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Statut</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Total TTC</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {devis.length > 0 ? (
                      devis.map((d) => (
                        <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-sm text-brand-primary">{d.numero}</td>
                          <td className="px-6 py-4 text-sm text-brand-secondary">{new Date(d.date_emission).toLocaleDateString('fr-FR')}</td>
                          <td className="px-6 py-4">
                             <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-gray-100 text-gray-600">
                              {d.statut}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-brand-primary">
                            {Number(d.total_ttc).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => downloadDevisPDF(d.id, d.numero)}
                              className="p-2 text-gray-400 hover:text-brand-primary transition-colors"
                            >
                              <Download size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">Aucun devis.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <h3 className="text-lg font-bold">Factures</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-bg-light">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Numéro</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Date</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Statut</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Total TTC</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {factures.length > 0 ? (
                      factures.map((f) => (
                        <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-sm text-brand-primary">{f.numero}</td>
                          <td className="px-6 py-4 text-sm text-brand-secondary">{new Date(f.date_emission).toLocaleDateString('fr-FR')}</td>
                          <td className="px-6 py-4">
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                f.statut === 'PAYE' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                             }`}>
                              {f.statut}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-brand-primary">
                            {Number(f.total_ttc).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button 
                              onClick={() => downloadFacturePDF(f.id, f.numero)}
                              className="p-2 text-gray-400 hover:text-brand-primary transition-colors"
                            >
                              <Download size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">Aucune facture.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientProfile;
