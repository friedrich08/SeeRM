import { useEffect } from 'react';
import { usePipelineStore } from '../store/usePipelineStore';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { formatXOF } from '../lib/currency';

const CalendarPage = () => {
  const { opportunities, fetchOpportunities } = usePipelineStore();

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const currentMonth = new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-brand-primary mb-2">Calendrier</h1>
        <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
          Suivez toutes les echeances de vos opportunites pour {currentMonth}.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="grid grid-cols-7 gap-3">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div key={day} className="text-[11px] font-bold text-gray-400 uppercase text-center pb-4">{day}</div>
                ))}
                {days.map(date => {
                    const dayOpps = opportunities.filter(o => o.date_echeance && new Date(o.date_echeance).getDate() === date);
                    return (
                        <div key={date} className="aspect-square bg-gray-50/50 border border-gray-100 rounded-2xl p-3 hover:bg-white hover:border-brand-primary/30 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
                            <span className="text-xs font-bold text-gray-400 group-hover:text-brand-primary">{date}</span>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {dayOpps.map((o, idx) => (
                                    <div key={idx} className="w-2 h-2 rounded-full bg-brand-primary shadow-sm" title={o.titre} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="space-y-6">
            <h3 className="font-bold text-brand-primary flex items-center gap-2">
                <Clock size={18} className="text-brand-accent" />
                Echeances proches
            </h3>
            <div className="space-y-4">
                {opportunities.filter(o => o.date_echeance).slice(0, 6).map(opt => (
                    <div key={opt.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <p className="text-[10px] font-bold text-brand-accent uppercase mb-1">
                            {new Date(opt.date_echeance!).toLocaleDateString('fr-FR')}
                        </p>
                        <h4 className="font-bold text-sm text-brand-primary mb-1">{opt.titre}</h4>
                        <p className="text-xs text-gray-500">{opt.client_detail?.nom_societe}</p>
                        <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                            <span className="text-xs font-bold">{formatXOF(opt.montant_estime)}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 uppercase">
                                {opt.statut}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
