import { useEffect, useMemo } from 'react';
import { Clock3, Flag, KanbanSquare } from 'lucide-react';
import { usePipelineStore } from '../store/usePipelineStore';
import { formatXOF } from '../lib/currency';

const ActiveTasks = () => {
  const { opportunities, fetchOpportunities, updateOpportunityStatus } = usePipelineStore();

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const activeItems = useMemo(
    () => opportunities.filter((item) => item.statut !== 'GAGNE' && item.statut !== 'PERDU'),
    [opportunities]
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-primary mb-2">Activite en cours</h1>
        <p className="text-gray-500 text-sm">Suivi des opportunites actives de votre session.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500">Total taches actives</p>
          <p className="text-2xl font-bold text-brand-primary">{activeItems.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500">Montant actif</p>
          <p className="text-2xl font-bold text-brand-primary">
            {formatXOF(activeItems.reduce((sum, item) => sum + Number(item.montant_estime || 0), 0))}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-xs text-gray-500">Priorite haute</p>
          <p className="text-2xl font-bold text-brand-primary">
            {activeItems.filter((item) => item.priorite === 'HIGH').length}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500">Titre</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500">Client</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500">Echeance</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500">Statut</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {activeItems.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-sm font-semibold text-brand-primary">
                  <div className="flex items-center gap-2">
                    <KanbanSquare size={15} className="text-gray-400" />
                    {item.titre}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{item.client_detail?.nom_societe || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock3 size={14} className="text-gray-400" />
                    {item.date_echeance || '-'}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex gap-1 items-center bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-full">
                    <Flag size={11} />
                    {item.priorite}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => updateOpportunityStatus(item.id, 'GAGNE')}
                    className="text-xs font-bold px-3 py-1 rounded-lg bg-green-600 text-white"
                  >
                    Marquer gagne
                  </button>
                </td>
              </tr>
            ))}
            {activeItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                  Aucune activite en cours.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActiveTasks;
