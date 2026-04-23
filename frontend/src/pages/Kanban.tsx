import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus, Layout, List, Calendar as CalendarIcon, Clock, Search, Download, Sparkles } from 'lucide-react';
import { usePipelineStore } from '../store/usePipelineStore';
import { KanbanColumn } from '../components/kanban/KanbanColumn';
import { KanbanCard } from '../components/kanban/KanbanCard';
import { formatXOF } from '../lib/currency';
import { downloadWorkbook } from '../lib/xlsx';
import api from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

const COLUMNS = [
  { id: 'PROSPECT', title: 'Prospection' },
  { id: 'QUALIFICATION', title: 'Qualification' },
  { id: 'PROPOSITION', title: 'Proposition' },
  { id: 'NEGOCIATION', title: 'Negociation' },
  { id: 'GAGNE', title: 'Gagne' },
];

type Client = {
  id: number;
  nom_societe: string;
};

const Kanban = ({ hideHeader = false }: { hideHeader?: boolean }) => {
  const can = useAuthStore((state) => state.can);
  const canWritePipeline = can('pipeline', 'write');
  const { opportunities, fetchOpportunities, updateOpportunityStatus, addOpportunity } = usePipelineStore();
  const [activeItem, setActiveItem] = useState<any>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'board' | 'calendar' | 'timeline'>('board');
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    titre: '',
    client: '',
    montant_estime: '',
    priorite: 'NORMAL',
    statut: 'PROSPECT',
    date_echeance: '',
    description: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchOpportunities();
    api.get('/clients/').then((response) => setClients(response.data));
  }, [fetchOpportunities]);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(
      (opportunity) =>
        opportunity.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opportunity.client_detail?.nom_societe.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [opportunities, searchTerm]);

  const byStatus = useMemo(
    () =>
      COLUMNS.reduce<Record<string, any[]>>((accumulator, column) => {
        accumulator[column.id] = filteredOpportunities.filter((opportunity) => opportunity.statut === column.id);
        return accumulator;
      }, {}),
    [filteredOpportunities]
  );

  const orderedTimeline = useMemo(
    () =>
      [...filteredOpportunities].sort((a, b) => {
        const aDate = a.date_echeance ? new Date(a.date_echeance).getTime() : Number.MAX_SAFE_INTEGER;
        const bDate = b.date_echeance ? new Date(b.date_echeance).getTime() : Number.MAX_SAFE_INTEGER;
        return aDate - bDate;
      }),
    [filteredOpportunities]
  );

  const handleDragStart = (event: any) => {
    const item = opportunities.find((opportunity) => opportunity.id === event.active.id);
    setActiveItem(item || null);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveItem(null);
    if (!over) return;
    if (canWritePipeline && COLUMNS.find((column) => column.id === over.id)) {
      await updateOpportunityStatus(Number(active.id), String(over.id));
    }
  };

  const submitOpportunity = async (event: FormEvent) => {
    event.preventDefault();
    await addOpportunity({
      titre: form.titre,
      client: Number(form.client),
      montant_estime: Number(form.montant_estime || 0),
      priorite: form.priorite,
      statut: form.statut,
      date_echeance: form.date_echeance || undefined,
      description: form.description,
    });
    setForm({
      titre: '',
      client: '',
      montant_estime: '',
      priorite: 'NORMAL',
      statut: 'PROSPECT',
      date_echeance: '',
      description: '',
    });
    setShowForm(false);
  };

  const exportSpreadsheet = () => {
    downloadWorkbook('pipeline-opportunites.xlsx', [
      {
        name: 'Pipeline',
        headers: ['Titre', 'Client', 'Montant estime', 'Priorite', 'Statut', 'Date echeance', 'Description'],
        rows: filteredOpportunities.map((opportunity) => [
          opportunity.titre,
          opportunity.client_detail?.nom_societe || '',
          Number(opportunity.montant_estime || 0),
          opportunity.priorite,
          opportunity.statut,
          opportunity.date_echeance || '',
          opportunity.description || '',
        ]),
      },
    ]);
  };

  return (
    <div className={hideHeader ? '' : 'animate-in fade-in slide-in-from-bottom-4 duration-700'}>
      {!hideHeader && (
        <header className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-brand-primary mb-2">Pipeline</h1>
            <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
              Gere vos opportunites et suivez votre cycle de vente.
            </p>
          </div>
          {canWritePipeline && (
            <button
              onClick={() => setShowForm((prev) => !prev)}
              className="bg-brand-primary text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-primary/20"
            >
              <Plus size={16} />
              Nouvelle opportunite
            </button>
          )}
        </header>
      )}

      {!hideHeader && (
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      {showForm && canWritePipeline && (
        <form onSubmit={submitOpportunity} className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-sm">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Titre</label>
            <input
              required
              placeholder="Ex: Refonte SI"
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/10"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Client</label>
            <select
              required
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/10"
            >
              <option value="">Selectionner</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nom_societe}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Montant</label>
            <input
              placeholder="0"
              type="number"
              value={form.montant_estime}
              onChange={(e) => setForm({ ...form, montant_estime: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/10"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Echeance</label>
            <input
              type="date"
              value={form.date_echeance}
              onChange={(e) => setForm({ ...form, date_echeance: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/10"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Priorite</label>
            <select
              value={form.priorite}
              onChange={(e) => setForm({ ...form, priorite: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/10"
            >
              <option value="LOW">Basse</option>
              <option value="NORMAL">Normale</option>
              <option value="HIGH">Haute</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Statut</label>
            <select
              value={form.statut}
              onChange={(e) => setForm({ ...form, statut: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/10"
            >
              {COLUMNS.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.title}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Description</label>
            <textarea
              placeholder="Details..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/10 h-20"
            />
          </div>
          <div className="md:col-span-3 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold text-gray-400">
              Annuler
            </button>
            <button className="bg-brand-primary text-white rounded-xl px-6 py-2 text-sm font-bold shadow-lg shadow-brand-primary/20">
              Enregistrer
            </button>
          </div>
        </form>
      )}

      <div className="flex justify-between items-center mb-8 border-b border-gray-100">
        <div className="flex gap-8">
          {[
            { id: 'spreadsheet', label: 'Tableur', icon: List },
            { id: 'board', label: 'Tableau', icon: Layout },
            { id: 'calendar', label: 'Calendrier', icon: CalendarIcon },
            { id: 'timeline', label: 'Chronologie', icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 text-[13px] font-bold transition-all flex items-center gap-2 relative ${activeTab === tab.id ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <tab.icon size={14} />
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary" />}
            </button>
          ))}
        </div>
        {activeTab === 'spreadsheet' && (
          <button
            onClick={exportSpreadsheet}
            className="mb-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-brand-primary shadow-sm hover:border-brand-primary/20"
          >
            <Download size={16} />
            Telecharger le fichier Excel
          </button>
        )}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'board' && (
          <div className="overflow-x-auto pb-8 -mx-8 px-8 custom-scrollbar">
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="flex gap-8 min-w-max">
                {COLUMNS.map((column) => (
                  <KanbanColumn key={column.id} id={column.id} title={column.title} items={byStatus[column.id] || []} />
                ))}
              </div>

              <DragOverlay
                dropAnimation={{
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: { active: { opacity: '0.5' } },
                  }),
                }}
              >
                {activeItem ? <KanbanCard item={activeItem} isOverlay /> : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}

        {activeTab === 'spreadsheet' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Opportunite</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Client</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Montant</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOpportunities.map((opportunity) => (
                  <tr key={opportunity.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-brand-primary">{opportunity.titre}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{opportunity.client_detail?.nom_societe}</td>
                    <td className="px-6 py-4 text-sm font-bold">{formatXOF(opportunity.montant_estime)}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 uppercase">
                        {opportunity.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="rounded-[2rem] border border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_35%),linear-gradient(180deg,_#ffffff,_#f8fbff)] p-8 shadow-sm">
            <div className="flex items-start justify-between gap-6 text-left">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                  <Sparkles size={12} />
                  Vue echeancier
                </div>
                <h3 className="text-xl font-bold text-brand-primary mb-2">Calendrier des echeances commerciales</h3>
                <p className="max-w-2xl text-sm text-gray-500">
                  Visualisez les jours les plus charges et reperez immediatement les opportunites a relancer.
                </p>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm border border-sky-100">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Echeances visibles</p>
                <p className="mt-1 text-2xl font-bold text-sky-700">{filteredOpportunities.filter((item) => item.date_echeance).length}</p>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-3 max-w-5xl mx-auto mt-8 rounded-[1.5rem] border border-sky-100 bg-white/80 p-4 shadow-inner">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div key={day} className="text-[10px] font-bold text-gray-400 uppercase pb-2">
                  {day}
                </div>
              ))}
              {Array.from({ length: 31 }).map((_, index) => {
                const date = index + 1;
                const dayOpportunities = filteredOpportunities.filter(
                  (opportunity) => opportunity.date_echeance && new Date(opportunity.date_echeance).getDate() === date
                );

                return (
                  <div
                    key={date}
                    className={`aspect-square rounded-2xl border p-3 flex flex-col items-start justify-between transition-all cursor-pointer relative overflow-hidden ${dayOpportunities.length > 0 ? 'border-sky-200 bg-sky-50/80 shadow-sm' : 'border-gray-100 bg-white hover:border-sky-100 hover:bg-sky-50/30'}`}
                  >
                    <span className={`text-xs font-bold ${dayOpportunities.length > 0 ? 'text-sky-700' : 'text-gray-400'}`}>{date}</span>
                    <div className="w-full">
                      <div className="flex flex-wrap gap-1 mt-1">
                        {dayOpportunities.slice(0, 3).map((opportunity, dotIndex) => (
                          <div key={dotIndex} className="w-2 h-2 rounded-full bg-sky-500 shadow-sm shadow-sky-200" title={opportunity.titre} />
                        ))}
                      </div>
                      {dayOpportunities.length > 0 && (
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700">
                          {dayOpportunities.length} echeance{dayOpportunities.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="rounded-[2rem] border border-amber-100 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.18),_transparent_32%),linear-gradient(180deg,_#ffffff,_#fffaf0)] p-8 shadow-sm">
            <div className="mb-8 flex items-start justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-brand-primary mb-2">Chronologie des actions a venir</h3>
                <p className="text-sm text-gray-500">Une lecture narrative du pipeline pour piloter les prochains points clients.</p>
              </div>
              <div className="rounded-2xl bg-white/85 px-4 py-3 shadow-sm border border-amber-100">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Prochaine echeance</p>
                <p className="mt-1 text-sm font-bold text-amber-700">
                  {orderedTimeline.find((item) => item.date_echeance)?.date_echeance
                    ? new Date(orderedTimeline.find((item) => item.date_echeance)!.date_echeance!).toLocaleDateString('fr-FR')
                    : 'Aucune'}
                </p>
              </div>
            </div>

            <div className="space-y-6 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-amber-100">
              {orderedTimeline.slice(0, 12).map((opportunity, index) => (
                <div key={index} className="flex gap-5 relative">
                  <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full border-4 bg-white z-10 shadow-sm ${opportunity.priorite === 'HIGH' ? 'border-rose-500' : opportunity.statut === 'GAGNE' ? 'border-emerald-500' : 'border-amber-400'}`} />
                  <div className="flex-1 rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1 tracking-[0.16em]">
                      {opportunity.date_echeance ? new Date(opportunity.date_echeance).toLocaleDateString('fr-FR') : 'Sans date'}
                    </p>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-brand-primary">{opportunity.titre}</h4>
                        <p className="mt-1 text-sm text-gray-500">{opportunity.client_detail?.nom_societe}</p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
                        {opportunity.statut}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm font-bold text-brand-primary">{formatXOF(opportunity.montant_estime)}</p>
                      <p className="text-xs text-gray-500">
                        Priorite {opportunity.priorite === 'HIGH' ? 'haute' : opportunity.priorite === 'LOW' ? 'basse' : 'normale'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Kanban;
