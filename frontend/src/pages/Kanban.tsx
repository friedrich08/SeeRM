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
import { Plus, Layout, List, Calendar as CalendarIcon, Clock, Search } from 'lucide-react';
import { usePipelineStore } from '../store/usePipelineStore';
import { KanbanColumn } from '../components/kanban/KanbanColumn';
import { KanbanCard } from '../components/kanban/KanbanCard';
import { formatXOF } from '../lib/currency';
import api from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

const COLUMNS = [
  { id: 'PROSPECT', title: 'Backlog' },
  { id: 'QUALIFICATION', title: 'In progress' },
  { id: 'PROPOSITION', title: 'Validation' },
  { id: 'NEGOCIATION', title: 'Finalizing' },
  { id: 'GAGNE', title: 'Done' },
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
    return opportunities.filter(opt => 
        opt.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.client_detail?.nom_societe.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [opportunities, searchTerm]);

  const byStatus = useMemo(
    () =>
      COLUMNS.reduce<Record<string, any[]>>((acc, col) => {
        acc[col.id] = filteredOpportunities.filter((opt) => opt.statut === col.id);
        return acc;
      }, {}),
    [filteredOpportunities]
  );

  const handleDragStart = (event: any) => {
    const item = opportunities.find((opt) => opt.id === event.active.id);
    setActiveItem(item || null);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveItem(null);
    if (!over) return;
    if (canWritePipeline && COLUMNS.find((c) => c.id === over.id)) {
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

  return (
    <div className={hideHeader ? "" : "animate-in fade-in slide-in-from-bottom-4 duration-700"}>
      {!hideHeader && (
        <header className="mb-6 flex justify-between items-end">
            <div>
            <h1 className="text-3xl font-bold tracking-tight text-brand-primary mb-2">Pipeline</h1>
            <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
                Gerez vos opportunites et suivez votre cycle de vente.
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
                <option value="LOW">BASSE</option>
                <option value="NORMAL">NORMALE</option>
                <option value="HIGH">HAUTE</option>
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
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold text-gray-400">Annuler</button>
            <button className="bg-brand-primary text-white rounded-xl px-6 py-2 text-sm font-bold shadow-lg shadow-brand-primary/20">
                Enregistrer
            </button>
          </div>
        </form>
      )}

      <div className="flex justify-between items-center mb-8 border-b border-gray-100">
        <div className="flex gap-8">
        {[
            { id: 'spreadsheet', label: 'Spreadsheet', icon: List },
            { id: 'board', label: 'Board', icon: Layout },
            { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
            { id: 'timeline', label: 'Timeline', icon: Clock },
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
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'board' && (
            <div className="overflow-x-auto pb-8 -mx-8 px-8 custom-scrollbar">
                <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex gap-8 min-w-max">
                    {COLUMNS.map((col) => (
                    <KanbanColumn key={col.id} id={col.id} title={col.title} items={byStatus[col.id] || []} />
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
                        {filteredOpportunities.map(opt => (
                            <tr key={opt.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4 text-sm font-bold text-brand-primary">{opt.titre}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{opt.client_detail?.nom_societe}</td>
                                <td className="px-6 py-4 text-sm font-bold">{formatXOF(opt.montant_estime)}</td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 uppercase">
                                        {opt.statut}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'calendar' && (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
                <CalendarIcon size={48} className="mx-auto text-gray-200 mb-4" />
                <h3 className="text-lg font-bold text-brand-primary mb-2">Calendrier des echeances</h3>
                <div className="grid grid-cols-7 gap-2 max-w-4xl mx-auto mt-8 border border-gray-100 rounded-2xl overflow-hidden shadow-inner bg-gray-50/30 p-4">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                        <div key={day} className="text-[10px] font-bold text-gray-400 uppercase pb-2">{day}</div>
                    ))}
                    {Array.from({ length: 31 }).map((_, i) => {
                        const date = i + 1;
                        const dayOpps = filteredOpportunities.filter(o => o.date_echeance && new Date(o.date_echeance).getDate() === date);
                        return (
                            <div key={i} className="aspect-square bg-white border border-gray-100 rounded-xl p-2 flex flex-col items-start justify-between hover:border-indigo-200 hover:shadow-sm transition-all group cursor-pointer relative overflow-hidden">
                                <span className="text-xs font-bold text-gray-400 group-hover:text-indigo-600">{date}</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {dayOpps.map((o, idx) => (
                                        <div key={idx} className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200" title={o.titre} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {activeTab === 'timeline' && (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                    {filteredOpportunities.slice(0, 10).map((opt, i) => (
                        <div key={i} className="flex gap-6 relative">
                            <div className="w-6 h-6 rounded-full bg-white border-4 border-indigo-500 z-10 shadow-sm" />
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                                    {opt.date_echeance ? new Date(opt.date_echeance).toLocaleDateString('fr-FR') : 'Sans date'}
                                </p>
                                <h4 className="font-bold text-brand-primary">{opt.titre}</h4>
                                <p className="text-sm text-gray-500">{opt.client_detail?.nom_societe} - {formatXOF(opt.montant_estime)}</p>
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
