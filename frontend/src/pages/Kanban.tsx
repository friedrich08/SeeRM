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
import { Plus, SlidersHorizontal, Layout, List, Calendar as CalendarIcon, Clock } from 'lucide-react';
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

  const byStatus = useMemo(
    () =>
      COLUMNS.reduce<Record<string, any[]>>((acc, col) => {
        acc[col.id] = opportunities.filter((opt) => opt.statut === col.id);
        return acc;
      }, {}),
    [opportunities]
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
                Manage your sales funnel and track every opportunity.
            </p>
            </div>
            {canWritePipeline && (
            <button
                onClick={() => setShowForm((prev) => !prev)}
                className="bg-brand-primary text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
            >
                <Plus size={16} />
                Nouvelle opportunite
            </button>
            )}
        </header>
      )}

      {showForm && canWritePipeline && (
        <form onSubmit={submitOpportunity} className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            required
            placeholder="Titre"
            value={form.titre}
            onChange={(e) => setForm({ ...form, titre: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <select
            required
            value={form.client}
            onChange={(e) => setForm({ ...form, client: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.nom_societe}
              </option>
            ))}
          </select>
          <input
            placeholder="Montant estime"
            type="number"
            value={form.montant_estime}
            onChange={(e) => setForm({ ...form, montant_estime: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={form.date_echeance}
            onChange={(e) => setForm({ ...form, date_echeance: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={form.priorite}
            onChange={(e) => setForm({ ...form, priorite: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="LOW">LOW</option>
            <option value="NORMAL">NORMAL</option>
            <option value="HIGH">HIGH</option>
          </select>
          <select
            value={form.statut}
            onChange={(e) => setForm({ ...form, statut: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            {COLUMNS.map((status) => (
              <option key={status.id} value={status.id}>
                {status.id}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm md:col-span-3"
          />
          <button className="md:col-span-3 bg-gray-900 text-white rounded-lg py-2 text-sm font-bold">
            Enregistrer
          </button>
        </form>
      )}

      {!hideHeader && (
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
            <div className="flex items-center gap-4 pb-4">
            <button className="flex items-center gap-2 text-[12px] font-bold text-gray-400 hover:text-brand-primary transition-colors">
                <Layout size={14} />
                Widgets
            </button>
            <button className="flex items-center gap-2 text-[12px] font-bold text-gray-400 hover:text-brand-primary transition-colors">
                <SlidersHorizontal size={14} />
                Filter
            </button>
            </div>
        </div>
      )}

      <div className="min-h-[400px]">
        {activeTab === 'board' && (
            <div className="overflow-x-auto pb-8 -mx-8 px-8">
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
                        {opportunities.map(opt => (
                            <tr key={opt.id} className="hover:bg-gray-50 transition-colors">
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
                <h3 className="text-lg font-bold text-brand-primary mb-2">Calendrier</h3>
                <div className="grid grid-cols-7 gap-2 max-w-2xl mx-auto mt-6">
                    {Array.from({ length: 31 }).map((_, i) => (
                        <div key={i} className="aspect-square border border-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors relative">
                            {i + 1}
                            {opportunities.some(o => o.date_echeance && new Date(o.date_echeance).getDate() === i + 1) && (
                                <div className="absolute w-1 h-1 bg-indigo-500 rounded-full translate-y-3"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'timeline' && (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                    {opportunities.slice(0, 10).map((opt, i) => (
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
