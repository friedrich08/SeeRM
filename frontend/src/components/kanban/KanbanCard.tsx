import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, MessageCircle, Link2, Flag } from 'lucide-react';
import { formatXOF } from '../../lib/currency';

export const KanbanCard = ({ item, isOverlay }: any) => {
  if (!item) return null;

  const itemId = String(item.id ?? '');
  const reference = `REL-${itemId.padStart(2, '0')}`;
  const priority = item.priority ?? item.priorite ?? 'NORMAL';
  const title = item.title ?? item.titre ?? 'Sans titre';
  const clientName = item.clientName ?? item.client_detail?.nom_societe ?? 'Client inconnu';
  const dueDate = item.dueDate ?? item.date_echeance ?? '-';
  const rawAmount = item.amount ?? item.montant_estime ?? 0;
  const amount = Number(rawAmount) || 0;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-5 rounded-2xl border border-gray-100 shadow-soft hover:shadow-card hover:border-gray-200 transition-all cursor-grab active:cursor-grabbing group ${isOverlay ? 'shadow-xl rotate-1 scale-105 z-[100]' : ''}`}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Link2 size={12} className="text-gray-400" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{reference}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${priority === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          <Flag size={10} fill="currentColor" />
          <span className="text-[10px] font-bold uppercase">{priority}</span>
        </div>
      </div>

      <h4 className="text-[14px] font-bold text-brand-primary mb-1 leading-snug">{title}</h4>
      <p className="text-[11px] text-gray-400 mb-4 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-200 inline-block" />
        {clientName}
      </p>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 text-gray-500">
          <Clock size={12} />
          <span className="text-[10px] font-bold">Echeance: {dueDate}</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-50">
        <div className="flex -space-x-2">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${itemId}`}
            className="w-7 h-7 rounded-full border-2 border-white bg-gray-100"
            alt="Avatar client"
          />
          <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-400">
            +1
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-gray-400">
            <MessageCircle size={14} />
            <span className="text-[10px] font-bold">3</span>
          </div>
          <span className="text-[12px] font-bold text-brand-primary">{formatXOF(amount)}</span>
        </div>
      </div>
    </div>
  );
};
