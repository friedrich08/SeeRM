import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { MoreHorizontal } from 'lucide-react';

export const KanbanColumn = ({ id, title, items }: any) => {
  const { setNodeRef } = useDroppable({ id });

  const getStatusIcon = (status: string) => {
    switch(status) {
        case 'PROSPECT': return '🌑';
        case 'QUALIFICATION': return '🔥';
        case 'PROPOSITION': return '✨';
        case 'NEGOCIATION': return '🤝';
        case 'GAGNE': return '✅';
        default: return '●';
    }
  };

  return (
    <div className="flex flex-col w-[300px] h-full">
      <div className="px-2 py-4 flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
            <span className="text-sm">{getStatusIcon(id)}</span>
            <h3 className="font-bold text-[13px] text-brand-primary tracking-tight">{title}</h3>
            <span className="text-[11px] font-bold text-gray-400">{items.length}</span>
        </div>
        <button className="text-gray-300 hover:text-gray-500">
            <MoreHorizontal size={16} />
        </button>
      </div>
      
      <div 
        ref={setNodeRef}
        className="flex-1 space-y-4 min-h-[500px]"
      >
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item: any) => (
            <KanbanCard key={item.id} item={item} />
          ))}
        </SortableContext>
        
        {/* Drop zone placeholder effect */}
        <div className="h-20 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-xs text-gray-300 font-bold tracking-widest uppercase">Drop here</span>
        </div>
      </div>
    </div>
  );
};
