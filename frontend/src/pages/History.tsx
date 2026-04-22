import { useEffect, useMemo } from 'react';
import { CheckCircle2, CircleX, ReceiptText } from 'lucide-react';
import { usePipelineStore } from '../store/usePipelineStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatXOF } from '../lib/currency';

const History = () => {
  const { opportunities, fetchOpportunities } = usePipelineStore();
  const { devis, fetchDevis } = useFinanceStore();

  useEffect(() => {
    fetchOpportunities();
    fetchDevis();
  }, [fetchOpportunities, fetchDevis]);

  const closedOpps = useMemo(
    () => opportunities.filter((item) => item.statut === 'GAGNE' || item.statut === 'PERDU'),
    [opportunities]
  );

  const closedDevis = useMemo(
    () => devis.filter((item) => ['ACCEPTE', 'PAYE', 'REFUSE'].includes(item.statut)),
    [devis]
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-primary mb-2">Historique</h1>
        <p className="text-gray-500 text-sm">Historique des resultats commerciaux et documents finalises.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-5">
          <h2 className="font-bold text-brand-primary mb-4">Opportunites cloturees</h2>
          <div className="space-y-3">
            {closedOpps.map((item) => (
              <div key={item.id} className="border border-gray-100 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-brand-primary">{item.titre}</p>
                  <p className="text-xs text-gray-500">{item.client_detail?.nom_societe || '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{formatXOF(item.montant_estime || 0)}</p>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold ${item.statut === 'GAGNE' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.statut === 'GAGNE' ? <CheckCircle2 size={13} /> : <CircleX size={13} />}
                    {item.statut}
                  </span>
                </div>
              </div>
            ))}
            {closedOpps.length === 0 && <p className="text-sm text-gray-400">Aucune opportunite cloturee.</p>}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-5">
          <h2 className="font-bold text-brand-primary mb-4">Devis finalises</h2>
          <div className="space-y-3">
            {closedDevis.map((item) => (
              <div key={item.id} className="border border-gray-100 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ReceiptText size={16} className="text-gray-400" />
                  <div>
                    <p className="font-semibold text-sm text-brand-primary">{item.numero}</p>
                    <p className="text-xs text-gray-500">{item.client_detail?.nom_societe || '-'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{formatXOF(item.total_ttc || 0)}</p>
                  <p className="text-xs font-bold text-brand-primary">{item.statut}</p>
                </div>
              </div>
            ))}
            {closedDevis.length === 0 && <p className="text-sm text-gray-400">Aucun devis finalise.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
