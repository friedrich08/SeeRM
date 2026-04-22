import React, { useEffect, useState } from 'react';
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
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { usePipelineStore } from '../store/usePipelineStore';
import { KanbanColumn } from '../components/kanban/KanbanColumn';
import { KanbanCard } from '../components/kanban/KanbanCard';
import { Filter, SlidersHorizontal, Layout } from 'lucide-react';

const COLUMNS = [
  { id: 'PROSPECT', title: 'Backlog' },
  { id: 'QUALIFICATION', title: 'In progress' },
  { id: 'PROPOSITION', title: 'Validation' },
  { id: 'NEGOCIATION', title: 'Finalizing' },
  { id: 'GAGNE', title: 'Done' }
];

const Kanban = () => {
  const { opportunities, isLoading, fetchOpportunities, updateOpportunityStatus } = usePipelineStore();
  const [activeItem, setActiveItem] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleDragStart = (event: any) => {
    const { active } = event;
    const item = opportunities.find((opt) => opt.id === active.id);
    setActiveItem(item);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (COLUMNS.find(c => c.id === overId)) {
        await updateOpportunityStatus(activeId, overId as any);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-primary mb-2">Pipeline</h1>
          <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
            Manage your sales funnel and track every opportunity.
          </p>
        </div>
      </header>

      {/* Tabs & Filters */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-100">
        <div className="flex gap-8">
            {['Spreadsheet', 'Board', 'Calendar', 'Timeline'].map((tab, i) => (
                <button key={tab} className={`pb-4 text-[13px] font-bold transition-all relative ${i === 1 ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}>
                    {tab}
                    {i === 1 && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary" />}
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

      <div className="overflow-x-auto pb-8 -mx-8 px-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-8 min-w-max">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                items={opportunities.filter((opt) => opt.statut === col.id)}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: '0.5' } }
            })
          }}>
            {activeItem ? <KanbanCard item={activeItem} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default Kanban;
