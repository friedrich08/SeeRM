import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClientStore } from '../store/useClientStore';
import { usePipelineStore } from '../store/usePipelineStore';
import { useFinanceStore, type LigneArticle } from '../store/useFinanceStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Users,
  TrendingUp,
  FileText,
  ArrowLeft,
  Download,
  Plus,
  UserCircle2,
  ClipboardList,
  MessageSquare,
  StickyNote,
  Receipt,
  Send,
} from 'lucide-react';
import { formatXOF } from '../lib/currency';
import { downloadWorkbook } from '../lib/xlsx';
import api from '../lib/api';

const CLIENT_LOGIN_MAP: Record<string, string> = {
  CEET: 'client.ceet@relatel.tg',
  'Lome Business School (LBS)': 'client.lbs@relatel.tg',
  Cannalbox: 'client.cannalbox@relatel.tg',
  Ecobank: 'client.ecobank@relatel.tg',
  'Yas Togo': 'client.yas@relatel.tg',
  'Togo Digital Services': 'client.tds@relatel.tg',
  'TVT (Television Togolaise)': 'client.tvt@relatel.tg',
  'Multinationale Friedrich D.': 'client.friedrich@relatel.tg',
};

const createEmptyLine = (): LigneArticle => ({
  designation: '',
  prix_unitaire: 0,
  quantite: 1,
  tva_taux: 0,
});

const emptyContactForm = {
  prenom: '',
  nom: '',
  email: '',
  telephone_direct: '',
  poste: '',
};

const emptyDocumentForm = {
  type: 'devis' as 'devis' | 'facture',
  statut: 'BROUILLON',
  date_echeance: '',
  notes: '',
  lignes: [createEmptyLine()] as LigneArticle[],
};
const OPPORTUNITY_STATUS_OPTIONS = ['PROSPECT', 'QUALIFICATION', 'PROPOSITION', 'NEGOCIATION', 'GAGNE', 'PERDU'] as const;

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can, user } = useAuthStore();
  const { currentClient, fetchClient, updateClient, isLoading: isClientLoading } = useClientStore();
  const { opportunities, fetchOpportunitiesByClient, updateOpportunityStatus } = usePipelineStore();
  const { devis, factures, fetchDevis, fetchFactures, downloadDevisPDF, downloadFacturePDF, createDevis, createFacture, updateFactureStatus } = useFinanceStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'opportunities' | 'finance'>('overview');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState(emptyContactForm);
  const [noteContent, setNoteContent] = useState('');
  const [documentForm, setDocumentForm] = useState(emptyDocumentForm);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canWritePipeline = can('pipeline', 'write');
  const canWriteFinance = can('finance', 'write');

  useEffect(() => {
    if (id) {
      const clientId = parseInt(id, 10);
      fetchClient(clientId);
      fetchOpportunitiesByClient(clientId);
      fetchDevis(clientId);
      fetchFactures(clientId);
    }
  }, [id, fetchClient, fetchOpportunitiesByClient, fetchDevis, fetchFactures]);

  const refreshClientData = async () => {
    if (!id) {
      return;
    }
    const clientId = parseInt(id, 10);
    await Promise.all([fetchClient(clientId), fetchDevis(clientId), fetchFactures(clientId)]);
  };

  const wonRevenue = useMemo(
    () => opportunities.reduce((sum, opportunity) => sum + (opportunity.statut === 'GAGNE' ? Number(opportunity.montant_estime || 0) : 0), 0),
    [opportunities]
  );
  const paidInvoices = factures.filter((invoice) => invoice.statut === 'PAYE');
  const outstandingInvoices = factures.filter((invoice) => invoice.statut !== 'PAYE');
  const portalLogin = currentClient ? CLIENT_LOGIN_MAP[currentClient.nom_societe] : '';
  const latestActivities = useMemo(
    () =>
      [
        ...opportunities.map((item) => ({ type: 'Opportunite', date: item.date_echeance || '', title: item.titre, meta: item.statut })),
        ...devis.map((item) => ({ type: 'Devis', date: item.date_emission, title: item.numero, meta: item.statut })),
        ...factures.map((item) => ({ type: 'Facture', date: item.date_emission, title: item.numero, meta: item.statut })),
      ]
        .filter((item) => item.date)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8),
    [opportunities, devis, factures]
  );

  if (isClientLoading && !currentClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary" />
      </div>
    );
  }

  if (!currentClient) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Client non trouve.</p>
        <button onClick={() => navigate('/clients')} className="mt-4 text-brand-primary font-medium hover:underline flex items-center gap-2 mx-auto">
          <ArrowLeft size={16} /> Retour a la liste
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Apercu', icon: Building2 },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'opportunities', label: 'Opportunites', icon: TrendingUp },
    { id: 'finance', label: 'Finance', icon: FileText },
  ];

  const exportClientSpreadsheet = () => {
    downloadWorkbook(`client-${currentClient.nom_societe.toLowerCase().replace(/\s+/g, '-')}.xlsx`, [
      {
        name: 'Synthese',
        headers: ['Categorie', 'Libelle', 'Valeur', 'Complement'],
        rows: [
          ['Client', 'Societe', currentClient.nom_societe, currentClient.type_client],
          ['Client', 'Email principal', currentClient.email_principal, currentClient.telephone || ''],
          ['Client', 'Adresse', currentClient.adresse || '', currentClient.siret || ''],
          ...opportunities.map((item) => ['Opportunite', item.titre, Number(item.montant_estime || 0), item.statut]),
          ...devis.map((item) => ['Devis', item.numero, Number(item.total_ttc || 0), item.statut]),
          ...factures.map((item) => ['Facture', item.numero, Number(item.total_ttc || 0), item.statut]),
        ],
      },
      {
        name: 'Contacts',
        headers: ['Prenom', 'Nom', 'Poste', 'E-mail', 'Telephone direct'],
        rows: (currentClient.contacts || []).map((contact) => [
          contact.prenom,
          contact.nom,
          contact.poste || '',
          contact.email,
          contact.telephone_direct || '',
        ]),
      },
      {
        name: 'Notes',
        headers: ['Date', 'Auteur', 'Contenu'],
        rows: (currentClient.notes || []).map((note) => [
          new Date(note.created_at).toLocaleString('fr-FR'),
          note.author_email || 'Utilisateur interne',
          note.content,
        ]),
      },
    ]);
  };

  const openConversation = async () => {
    setActionError('');
    setActionMessage('');
    try {
      const response = await api.post('/conversations/', { client: currentClient.id });
      navigate(`/chat?conversation=${response.data.id}`);
    } catch (error: any) {
      setActionError(error?.response?.data?.detail || 'Impossible d ouvrir la conversation pour ce client.');
    }
  };

  const convertProspectToClient = async () => {
    if (!currentClient || currentClient.type_client === 'CLIENT') {
      return;
    }
    setActionError('');
    setActionMessage('');
    try {
      await updateClient(currentClient.id, { type_client: 'CLIENT' });
      await refreshClientData();
      setActionMessage('Le prospect a ete converti en client.');
    } catch (error: any) {
      setActionError(error?.response?.data?.detail || 'Impossible de convertir ce prospect en client.');
    }
  };

  const confirmInvoicePayment = async (invoiceId: number) => {
    if (!currentClient) {
      return;
    }
    setActionError('');
    setActionMessage('');
    try {
      await updateFactureStatus(invoiceId, 'PAYE');
      await fetchFactures(currentClient.id);
      setActionMessage('La facture est marquee comme payee.');
    } catch (error: any) {
      setActionError(error?.response?.data?.detail || 'Impossible de confirmer le paiement de cette facture.');
    }
  };

  const updateOpportunity = async (opportunityId: number, statut: string) => {
    if (!currentClient) {
      return;
    }
    setActionError('');
    setActionMessage('');
    try {
      await updateOpportunityStatus(opportunityId, statut);
      await fetchOpportunitiesByClient(currentClient.id);
      setActionMessage('Le statut de l opportunite a ete mis a jour.');
    } catch (error: any) {
      setActionError(error?.response?.data?.detail || 'Impossible de modifier le statut de cette opportunite.');
    }
  };

  const handleCreateContact = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setActionError('');
    setActionMessage('');
    try {
      await api.post('/contacts/', {
        client: currentClient.id,
        ...contactForm,
      });
      await refreshClientData();
      setContactForm(emptyContactForm);
      setIsContactModalOpen(false);
      setActiveTab('contacts');
      setActionMessage('Le contact a bien ete ajoute.');
    } catch (error: any) {
      setActionError(error?.response?.data?.detail || 'Impossible de creer ce contact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNote = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setActionError('');
    setActionMessage('');
    try {
      await api.post('/client-notes/', {
        client: currentClient.id,
        content: noteContent,
      });
      await refreshClientData();
      setNoteContent('');
      setIsNoteModalOpen(false);
      setActionMessage('La note interne a ete enregistree.');
    } catch (error: any) {
      setActionError(error?.response?.data?.detail || 'Impossible d enregistrer cette note interne.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDocument = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setActionError('');
    setActionMessage('');

    const lignes = documentForm.lignes
      .map((ligne) => ({
        designation: ligne.designation.trim(),
        quantite: Number(ligne.quantite || 0),
        prix_unitaire: Number(ligne.prix_unitaire || 0),
        tva_taux: Number(ligne.tva_taux || 0),
      }))
      .filter((ligne) => ligne.designation || ligne.prix_unitaire > 0);

    if (lignes.length === 0) {
      setActionError('Ajoutez au moins une ligne avec un prix.');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        client: currentClient.id,
        statut: documentForm.statut,
        notes: documentForm.notes,
        date_echeance: documentForm.date_echeance || undefined,
        lignes,
      };
      if (documentForm.type === 'devis') {
        await createDevis(payload);
      } else {
        await createFacture(payload);
      }
      await refreshClientData();
      setDocumentForm(emptyDocumentForm);
      setIsDocumentModalOpen(false);
      setActiveTab('finance');
      setActionMessage(documentForm.type === 'devis' ? 'Le devis a ete cree.' : 'La facture a ete creee.');
    } catch {
      setActionError(documentForm.type === 'devis' ? 'Impossible de creer le devis.' : 'Impossible de creer la facture.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDocumentLine = (index: number, field: keyof LigneArticle, value: string) => {
    setDocumentForm((current) => ({
      ...current,
      lignes: current.lignes.map((ligne, lineIndex) =>
        lineIndex === index
          ? {
              ...ligne,
              [field]: field === 'designation' ? value : Number(value),
            }
          : ligne
      ),
    }));
  };

  const addDocumentLine = () => {
    setDocumentForm((current) => ({
      ...current,
      lignes: [...current.lignes, createEmptyLine()],
    }));
  };

  const removeDocumentLine = (index: number) => {
    setDocumentForm((current) => ({
      ...current,
      lignes: current.lignes.length === 1 ? [createEmptyLine()] : current.lignes.filter((_, lineIndex) => lineIndex !== index),
    }));
  };

  const totalPreview = documentForm.lignes.reduce(
    (sum, ligne) => sum + Number(ligne.quantite || 0) * Number(ligne.prix_unitaire || 0),
    0
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8">
        <button onClick={() => navigate('/clients')} className="group flex items-center gap-2 text-brand-secondary hover:text-brand-primary transition-colors mb-4">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Retour aux clients</span>
        </button>

        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center text-brand-primary border border-brand-primary/10 overflow-hidden">
              {currentClient.avatar_url ? (
                <img src={currentClient.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Building2 size={32} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{currentClient.nom_societe}</h1>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${currentClient.type_client === 'CLIENT' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                  {currentClient.type_client}
                </span>
              </div>
              <p className="text-brand-secondary flex items-center gap-2 mt-1">
                <Mail size={14} /> {currentClient.email_principal}
                <span className="text-gray-300">/</span>
                <Phone size={14} /> {currentClient.telephone || 'Non renseigne'}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap gap-3 lg:w-auto">
            <a href={`mailto:${currentClient.email_principal}`} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-brand-primary shadow-sm">
              <Mail size={16} />
              Contacter
            </a>
            <button onClick={openConversation} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-brand-primary shadow-sm">
              <MessageSquare size={16} />
              Ouvrir la conversation
            </button>
            <button onClick={() => setIsDocumentModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm">
              <Receipt size={16} />
              Envoyer un devis ou une facture
            </button>
            <button onClick={exportClientSpreadsheet} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-primary/20">
              <Download size={16} />
              Exporter le fichier Excel
            </button>
            {user?.role === 'ADMIN' && currentClient.type_client === 'PROSPECT' && (
              <button
                onClick={convertProspectToClient}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm"
              >
                Convertir en client
              </button>
            )}
          </div>
        </div>
      </header>

      {(actionMessage || actionError) && (
        <div className={`mb-6 rounded-2xl px-4 py-3 text-sm ${actionError ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {actionError || actionMessage}
        </div>
      )}

      <nav className="mb-8 w-fit rounded-2xl bg-gray-100/50 p-1">
        <div className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'overview' | 'contacts' | 'opportunities' | 'finance')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${activeTab === tab.id ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-secondary hover:text-brand-primary hover:bg-white/50'}`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
        </div>
      </nav>

      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Building2 size={20} className="text-brand-primary" />
                  Informations generales
                </h3>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">SIRET</p>
                    <p className="font-mono text-brand-primary">{currentClient.siret || 'Non renseigne'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">E-mail principal</p>
                    <p className="text-brand-primary">{currentClient.email_principal}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Telephone</p>
                    <p className="text-brand-primary">{currentClient.telephone || 'Non renseigne'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Adresse</p>
                    <p className="text-brand-primary flex items-start gap-1">
                      <MapPin size={16} className="text-gray-300 mt-0.5 shrink-0" />
                      {currentClient.adresse || 'Non renseignee'}
                    </p>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Opportunites</p>
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

              <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <StickyNote size={18} className="text-brand-primary" />
                    <h3 className="font-bold text-brand-primary">Notes internes</h3>
                  </div>
                  <button onClick={() => setIsNoteModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-brand-primary">
                    <Plus size={16} />
                    Ajouter une note
                  </button>
                </div>
                <div className="space-y-3">
                  {(currentClient.notes || []).length > 0 ? (
                    currentClient.notes!.map((note) => (
                      <div key={note.id} className="rounded-2xl bg-gray-50 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">{new Date(note.created_at).toLocaleString('fr-FR')}</p>
                          <p className="text-xs text-gray-500">{note.author_email || 'Utilisateur interne'}</p>
                        </div>
                        <p className="mt-2 text-sm text-brand-primary">{note.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-gray-50 px-4 py-6 text-sm text-gray-400">Aucune note interne pour le moment.</p>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="bg-brand-primary text-white p-8 rounded-3xl shadow-xl shadow-brand-primary/20 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-4">Valeur du compte</h3>
                  <p className="text-4xl font-bold mb-2">{formatXOF(wonRevenue)}</p>
                  <p className="text-brand-primary-light text-sm opacity-80">Chiffre d affaires total genere</p>
                </div>
                <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 -rotate-12" />
              </section>

              <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <UserCircle2 size={18} className="text-brand-primary" />
                  <h3 className="font-bold text-brand-primary">Acces portail client</h3>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Identifiant</p>
                  <p className="mt-1 text-sm font-bold text-brand-primary">{portalLogin || 'Compte client non catalogue'}</p>
                  <p className="mt-2 text-xs text-gray-500">Mot de passe de demo : Client@123</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-gray-100 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Factures payees</p>
                    <p className="mt-1 text-lg font-bold text-brand-primary">{paidInvoices.length}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Factures en attente</p>
                    <p className="mt-1 text-lg font-bold text-brand-primary">{outstandingInvoices.length}</p>
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <ClipboardList size={18} className="text-brand-primary" />
                  <h3 className="font-bold text-brand-primary">Activite recente</h3>
                </div>
                <div className="space-y-3">
                  {latestActivities.map((item, index) => (
                    <div key={`${item.type}-${item.title}-${index}`} className="flex items-start gap-3 rounded-2xl bg-gray-50 p-3">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-primary" />
                      <div>
                        <p className="text-sm font-bold text-brand-primary">{item.type} {item.title}</p>
                        <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString('fr-FR')} / {item.meta}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold">Liste des contacts</h3>
              <button onClick={() => setIsContactModalOpen(true)} className="text-brand-primary text-sm font-bold flex items-center gap-1 hover:bg-brand-primary/5 px-3 py-1.5 rounded-lg transition-colors">
                <Plus size={16} /> Creer un contact
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-bg-light">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Nom</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Poste</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">E-mail</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Telephone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentClient.contacts && currentClient.contacts.length > 0 ? (
                    currentClient.contacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-brand-primary">{contact.prenom} {contact.nom}</td>
                        <td className="px-6 py-4 text-sm text-brand-secondary">{contact.poste || '-'}</td>
                        <td className="px-6 py-4 text-sm text-brand-primary">{contact.email}</td>
                        <td className="px-6 py-4 text-sm text-brand-secondary">{contact.telephone_direct || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">Aucun contact enregistre.</td>
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
              <h3 className="text-lg font-bold">Opportunites commerciales</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-bg-light">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Titre</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Statut</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Montant</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary text-right">Echeance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {opportunities.length > 0 ? (
                    opportunities.map((opportunity) => (
                      <tr key={opportunity.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-brand-primary">{opportunity.titre}</td>
                        <td className="px-6 py-4">
                          {canWritePipeline ? (
                            <select
                              value={opportunity.statut}
                              onChange={(event) => updateOpportunity(opportunity.id, event.target.value)}
                              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-bold uppercase text-brand-primary"
                            >
                              {OPPORTUNITY_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${opportunity.statut === 'GAGNE' ? 'bg-green-50 text-green-600' : opportunity.statut === 'PERDU' ? 'bg-red-50 text-red-600' : 'bg-brand-primary/5 text-brand-primary'}`}>
                              {opportunity.statut}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-brand-primary">{formatXOF(Number(opportunity.montant_estime))}</td>
                        <td className="px-6 py-4 text-sm text-brand-secondary text-right">
                          {opportunity.date_echeance ? new Date(opportunity.date_echeance).toLocaleDateString('fr-FR') : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">Aucune opportunite en cours.</td>
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
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-lg font-bold">Devis</h3>
                <button onClick={() => setIsDocumentModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                  <Send size={16} />
                  Envoyer un document
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-bg-light">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Numero</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Date</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Statut</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Total TTC</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {devis.length > 0 ? (
                      devis.map((quote) => (
                        <tr key={quote.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-sm text-brand-primary">{quote.numero}</td>
                          <td className="px-6 py-4 text-sm text-brand-secondary">{new Date(quote.date_emission).toLocaleDateString('fr-FR')}</td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-gray-100 text-gray-600">{quote.statut}</span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-brand-primary">{formatXOF(Number(quote.total_ttc))}</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => downloadDevisPDF(quote.id, quote.numero)} className="p-2 text-gray-400 hover:text-brand-primary transition-colors" title="Telecharger le PDF">
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
                <table className="w-full min-w-[860px] text-left">
                  <thead className="bg-bg-light">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Numero</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Date</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Statut</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary">Total TTC</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-brand-secondary text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {factures.length > 0 ? (
                      factures.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-sm text-brand-primary">{invoice.numero}</td>
                          <td className="px-6 py-4 text-sm text-brand-secondary">{new Date(invoice.date_emission).toLocaleDateString('fr-FR')}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${invoice.statut === 'PAYE' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>{invoice.statut}</span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-brand-primary">{formatXOF(Number(invoice.total_ttc))}</td>
                          <td className="px-6 py-4 text-right">
                            {canWriteFinance && invoice.statut !== 'PAYE' && (
                              <button
                                onClick={() => confirmInvoicePayment(invoice.id)}
                                className="mr-2 rounded-lg border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700"
                                title="Confirmer le paiement"
                              >
                                Marquer payee
                              </button>
                            )}
                            <button onClick={() => downloadFacturePDF(invoice.id, invoice.numero)} className="p-2 text-gray-400 hover:text-brand-primary transition-colors" title="Telecharger le PDF">
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

      {isContactModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-primary/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-brand-primary">Creer un contact</h2>
              <button onClick={() => setIsContactModalOpen(false)} className="rounded-xl px-3 py-2 text-sm text-gray-500 hover:bg-gray-50">Fermer</button>
            </div>
            <form onSubmit={handleCreateContact} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input required placeholder="Prenom" value={contactForm.prenom} onChange={(e) => setContactForm((current) => ({ ...current, prenom: e.target.value }))} className="rounded-2xl border border-gray-200 px-4 py-3 text-sm" />
              <input required placeholder="Nom" value={contactForm.nom} onChange={(e) => setContactForm((current) => ({ ...current, nom: e.target.value }))} className="rounded-2xl border border-gray-200 px-4 py-3 text-sm" />
              <input required type="email" placeholder="E-mail professionnel" value={contactForm.email} onChange={(e) => setContactForm((current) => ({ ...current, email: e.target.value }))} className="rounded-2xl border border-gray-200 px-4 py-3 text-sm" />
              <input placeholder="Telephone direct" value={contactForm.telephone_direct} onChange={(e) => setContactForm((current) => ({ ...current, telephone_direct: e.target.value }))} className="rounded-2xl border border-gray-200 px-4 py-3 text-sm" />
              <input placeholder="Poste" value={contactForm.poste} onChange={(e) => setContactForm((current) => ({ ...current, poste: e.target.value }))} className="rounded-2xl border border-gray-200 px-4 py-3 text-sm md:col-span-2" />
              <div className="md:col-span-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsContactModalOpen(false)} className="rounded-xl px-4 py-2 text-sm font-bold text-gray-500">Annuler</button>
                <button disabled={isSubmitting} className="rounded-xl bg-brand-primary px-5 py-2 text-sm font-bold text-white">{isSubmitting ? 'Creation...' : 'Creer le contact'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isNoteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-primary/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-brand-primary">Ajouter une note interne</h2>
              <button onClick={() => setIsNoteModalOpen(false)} className="rounded-xl px-3 py-2 text-sm text-gray-500 hover:bg-gray-50">Fermer</button>
            </div>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <textarea required value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Saisissez votre note interne..." className="h-40 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsNoteModalOpen(false)} className="rounded-xl px-4 py-2 text-sm font-bold text-gray-500">Annuler</button>
                <button disabled={isSubmitting} className="rounded-xl bg-brand-primary px-5 py-2 text-sm font-bold text-white">{isSubmitting ? 'Enregistrement...' : 'Enregistrer la note'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDocumentModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-brand-primary/30 p-4 backdrop-blur-sm">
          <div className="mx-auto mt-8 w-full max-w-4xl rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-brand-primary">Creation rapide d un document</h2>
                <p className="mt-1 text-sm text-gray-500">Generez un devis ou une facture directement depuis la fiche client.</p>
              </div>
              <button onClick={() => setIsDocumentModalOpen(false)} className="rounded-xl px-3 py-2 text-sm text-gray-500 hover:bg-gray-50">Fermer</button>
            </div>
            <form onSubmit={handleCreateDocument} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <select value={documentForm.type} onChange={(e) => setDocumentForm((current) => ({ ...current, type: e.target.value as 'devis' | 'facture', statut: e.target.value === 'facture' ? 'BROUILLON' : current.statut }))} className="rounded-2xl border border-gray-200 px-4 py-3 text-sm">
                  <option value="devis">Devis</option>
                  <option value="facture">Facture</option>
                </select>
                <select value={documentForm.statut} onChange={(e) => setDocumentForm((current) => ({ ...current, statut: e.target.value }))} className="rounded-2xl border border-gray-200 px-4 py-3 text-sm">
                  <option value="BROUILLON">BROUILLON</option>
                  <option value="ENVOYE">ENVOYE</option>
                  {documentForm.type === 'devis' && <option value="ACCEPTE">ACCEPTE</option>}
                  {documentForm.type === 'facture' && <option value="PAYE">PAYE</option>}
                </select>
                <input type="date" value={documentForm.date_echeance} onChange={(e) => setDocumentForm((current) => ({ ...current, date_echeance: e.target.value }))} className="rounded-2xl border border-gray-200 px-4 py-3 text-sm" />
              </div>
              <textarea value={documentForm.notes} onChange={(e) => setDocumentForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Notes du document..." className="h-28 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm" />
              <div className="rounded-3xl border border-gray-200">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div>
                    <p className="font-bold text-brand-primary">Lignes de facturation</p>
                    <p className="text-sm text-gray-500">Le montant est calcule automatiquement.</p>
                  </div>
                  <button type="button" onClick={addDocumentLine} className="rounded-xl border border-brand-primary/20 px-3 py-2 text-sm font-bold text-brand-primary">
                    Ajouter une ligne
                  </button>
                </div>
                <div className="space-y-3 p-4">
                  {documentForm.lignes.map((ligne, index) => (
                    <div key={`${index}-${documentForm.type}`} className="grid grid-cols-1 gap-3 rounded-2xl bg-gray-50 p-4 md:grid-cols-[2fr_120px_160px_140px_auto]">
                      <input required value={ligne.designation} onChange={(e) => updateDocumentLine(index, 'designation', e.target.value)} placeholder="Designation" className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                      <input required min="1" type="number" value={ligne.quantite} onChange={(e) => updateDocumentLine(index, 'quantite', e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                      <input required min="0" step="0.01" type="number" value={ligne.prix_unitaire} onChange={(e) => updateDocumentLine(index, 'prix_unitaire', e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                      <div className="flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-brand-primary">{formatXOF(Number(ligne.quantite || 0) * Number(ligne.prix_unitaire || 0))}</div>
                      <button type="button" onClick={() => removeDocumentLine(index)} className="rounded-xl px-3 py-2 text-sm font-bold text-gray-500 hover:bg-white">Retirer</button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                  <span className="text-sm text-gray-500">Total HT estime</span>
                  <span className="text-lg font-bold text-brand-primary">{formatXOF(totalPreview)}</span>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsDocumentModalOpen(false)} className="rounded-xl px-4 py-2 text-sm font-bold text-gray-500">Annuler</button>
                <button disabled={isSubmitting} className="rounded-xl bg-brand-primary px-5 py-2 text-sm font-bold text-white">{isSubmitting ? 'Generation...' : documentForm.type === 'devis' ? 'Creer le devis' : 'Creer la facture'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProfile;
