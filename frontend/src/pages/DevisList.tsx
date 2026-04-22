import React, { useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { FileText, Download, Plus, FileSearch } from 'lucide-react';
import { formatXOF } from '../lib/currency';

const DevisList = () => {
  const { devis, isLoading, fetchDevis, downloadPDF } = useFinanceStore();

  useEffect(() => {
    fetchDevis();
  }, [fetchDevis]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-1">Devis & Facturation</h1>
          <p className="text-brand-secondary">Gérez vos documents financiers et téléchargez vos exports PDF.</p>
        </div>
        <button className="bg-brand-primary text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-brand-primary/20 hover:scale-105 transition-transform active:scale-95 flex items-center gap-2">
          <Plus size={18} />
          Créer un Devis
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-light border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">Numéro</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">Client</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">Statut</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">Montant TTC</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
                  </td>
                </tr>
              ) : devis.length > 0 ? (
                devis.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-sm font-bold text-brand-primary">
                      {item.numero}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-brand-primary">{item.client_detail?.nom_societe}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(item.date_emission).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                        item.statut === 'BROUILLON' ? 'bg-gray-100 text-gray-500' : 
                        item.statut === 'ENVOYE' ? 'bg-blue-50 text-blue-600' :
                        'bg-green-50 text-green-600'
                      }`}>
                        {item.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-brand-primary">
                      {formatXOF(item.total_ttc)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-brand-primary hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-100 shadow-none hover:shadow-sm">
                          <FileSearch size={18} />
                        </button>
                        <button 
                          onClick={() => downloadPDF(item.id, item.numero)}
                          className="p-2 text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-all border border-transparent hover:border-brand-accent/20 shadow-none hover:shadow-sm"
                          title="Télécharger le PDF"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400 italic">
                    Aucun devis trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                <FileText size={28} />
            </div>
            <div>
                <h4 className="text-lg font-bold">Modèles de Devis</h4>
                <p className="text-sm text-brand-secondary">Personnalisez l'apparence de vos exports PDF.</p>
            </div>
            <button className="ml-auto text-sm font-bold text-brand-primary hover:underline">Gérer</button>
        </div>
      </div>
    </div>
  );
};