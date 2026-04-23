import { useEffect, useState, type FormEvent, useMemo } from 'react';
import { useFinanceStore, type LigneArticle } from '../store/useFinanceStore';
import { Download, Plus, FileSearch, Search, Trash2 } from 'lucide-react';
import { formatXOF } from '../lib/currency';
import api from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

const createEmptyLine = (): LigneArticle => ({
  designation: '',
  prix_unitaire: 0,
  quantite: 1,
  tva_taux: 0,
});

const DevisList = () => {
  const can = useAuthStore((state) => state.can);
  const canWriteFinance = can('finance', 'write');
  const { 
    devis, 
    factures, 
    isLoading, 
    fetchDevis, 
    fetchFactures, 
    downloadDevisPDF, 
    downloadFacturePDF,
    createDevis,
    createFacture
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState<'devis' | 'factures'>('devis');
  const [clients, setClients] = useState<Array<{ id: number; nom_societe: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitError, setSubmitError] = useState('');
  
  const [form, setForm] = useState({
    client: '',
    statut: 'BROUILLON',
    notes: '',
    date_echeance: '',
    lignes: [createEmptyLine()] as LigneArticle[],
  });

  useEffect(() => {
    fetchDevis();
    fetchFactures();
    api.get('/clients/').then((response) => setClients(response.data));
  }, [fetchDevis, fetchFactures]);

  const filteredData = useMemo(() => {
    const data = activeTab === 'devis' ? devis : factures;
    return data.filter(item => 
        item.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.client_detail?.nom_societe.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeTab, devis, factures, searchTerm]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError('');

    const lignes = form.lignes
      .map((ligne) => ({
        designation: ligne.designation.trim(),
        quantite: Number(ligne.quantite || 0),
        prix_unitaire: Number(ligne.prix_unitaire || 0),
        tva_taux: Number(ligne.tva_taux || 0),
      }))
      .filter((ligne) => ligne.designation || ligne.prix_unitaire > 0);

    if (lignes.length === 0) {
      setSubmitError('Ajoutez au moins une ligne avec un prix.');
      return;
    }

    if (lignes.some((ligne) => !ligne.designation || ligne.quantite <= 0 || ligne.prix_unitaire < 0)) {
      setSubmitError('Chaque ligne doit avoir une designation, une quantite valide et un prix.');
      return;
    }

    const payload = {
      client: Number(form.client),
      statut: form.statut,
      notes: form.notes,
      date_echeance: form.date_echeance || undefined,
      lignes,
    };

    try {
      if (activeTab === 'devis') {
        await createDevis(payload);
      } else {
        await createFacture(payload);
      }
    } catch {
      setSubmitError("La creation du document a echoue. Verifiez les champs saisis.");
      return;
    }

    setForm({ client: '', statut: 'BROUILLON', notes: '', date_echeance: '', lignes: [createEmptyLine()] });
    setShowForm(false);
  };

  const updateLine = (index: number, field: keyof LigneArticle, value: string) => {
    setForm((current) => ({
      ...current,
      lignes: current.lignes.map((ligne, lineIndex) =>
        lineIndex === index
          ? {
              ...ligne,
              [field]: field === 'designation' ? value : Number(value),
            }
          : ligne
      ),
    }));
  };

  const addLine = () => {
    setForm((current) => ({
      ...current,
      lignes: [...current.lignes, createEmptyLine()],
    }));
  };

  const removeLine = (index: number) => {
    setForm((current) => ({
      ...current,
      lignes: current.lignes.length === 1
        ? [createEmptyLine()]
        : current.lignes.filter((_, lineIndex) => lineIndex !== index),
    }));
  };

  const totalPreview = form.lignes.reduce(
    (sum, ligne) => sum + Number(ligne.quantite || 0) * Number(ligne.prix_unitaire || 0),
    0
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-1">Finance</h1>
          <p className="text-brand-secondary">Gerez vos devis et factures, avec envois automatiques par email.</p>
        </div>
        {canWriteFinance && (
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="bg-brand-primary text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-brand-primary/20 hover:scale-105 transition-transform active:scale-95 flex items-center gap-2"
          >
            <Plus size={18} />
            Creer un {activeTab === 'devis' ? 'Devis' : 'Facture'}
          </button>
        )}
      </header>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
            <button 
            onClick={() => setActiveTab('devis')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'devis' ? 'bg-brand-primary text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'}`}
            >
            Devis
            </button>
            <button 
            onClick={() => setActiveTab('factures')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'factures' ? 'bg-brand-primary text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'}`}
            >
            Factures
            </button>
        </div>
        <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
                type="text" 
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {showForm && canWriteFinance && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-3xl p-6 mb-8 shadow-sm animate-in zoom-in-95 duration-200">
          <h3 className="font-bold mb-4 text-brand-primary">Nouveau {activeTab === 'devis' ? 'Devis' : 'Facture'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Client</label>
              <select
                required
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary/10"
              >
                <option value="">Selectionner un client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nom_societe}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Statut initial</label>
              <select
                value={form.statut}
                onChange={(e) => setForm({ ...form, statut: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary/10"
              >
                <option value="BROUILLON">BROUILLON</option>
                <option value="ENVOYE">ENVOYE (Declenche Email)</option>
                <option value="ACCEPTE">ACCEPTE</option>
                {activeTab === 'factures' && <option value="PAYE">PAYE</option>}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Echeance</label>
              <input
                type="date"
                value={form.date_echeance}
                onChange={(e) => setForm({ ...form, date_echeance: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary/10"
              />
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Notes / Description</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Details du document..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary/10 h-20"
              />
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-bg-light border-b border-gray-200">
              <div>
                <p className="text-sm font-bold text-brand-primary">Lignes d'articles</p>
                <p className="text-xs text-gray-500">Saisissez le prix unitaire pour calculer le montant du document.</p>
              </div>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold text-brand-primary bg-white border border-brand-primary/20 rounded-xl"
              >
                <Plus size={16} />
                Ajouter une ligne
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-brand-secondary">Designation</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-brand-secondary">Quantite</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-brand-secondary">Prix unitaire</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-brand-secondary">Montant</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-brand-secondary text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {form.lignes.map((ligne, index) => {
                    const montantLigne = Number(ligne.quantite || 0) * Number(ligne.prix_unitaire || 0);

                    return (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <input
                            required
                            type="text"
                            value={ligne.designation}
                            onChange={(e) => updateLine(index, 'designation', e.target.value)}
                            placeholder="Ex: Maintenance mensuelle"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary/10"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            required
                            min="1"
                            type="number"
                            value={ligne.quantite}
                            onChange={(e) => updateLine(index, 'quantite', e.target.value)}
                            className="w-24 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary/10"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            required
                            min="0"
                            step="0.01"
                            type="number"
                            value={ligne.prix_unitaire}
                            onChange={(e) => updateLine(index, 'prix_unitaire', e.target.value)}
                            className="w-36 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary/10"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-brand-primary">{formatXOF(montantLigne)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeLine(index)}
                            className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Supprimer la ligne"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-bg-light border-t border-gray-200">
              <span className="text-sm text-gray-500">Total HT estime</span>
              <span className="text-lg font-bold text-brand-primary">{formatXOF(totalPreview)}</span>
            </div>
          </div>
          {submitError && (
            <p className="mt-4 text-sm font-medium text-red-600">{submitError}</p>
          )}
          <div className="mt-4 flex justify-end gap-3">
             <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold text-gray-400">Annuler</button>
             <button type="submit" className="bg-brand-primary text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand-primary/20">
               Enregistrer & Generer
             </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-light border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">Numero</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">Client</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">Statut</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-secondary">Total TTC</th>
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
              ) : filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-sm font-bold text-brand-primary">{item.numero}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-brand-primary">{item.client_detail?.nom_societe}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.date_emission).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                          item.statut === 'BROUILLON' ? 'bg-gray-100 text-gray-500' : 
                          item.statut === 'ENVOYE' ? 'bg-blue-50 text-blue-600' : 
                          item.statut === 'PAYE' ? 'bg-green-50 text-green-600' :
                          'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {item.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-brand-primary">{formatXOF(item.total_ttc)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-brand-primary hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-100 shadow-none hover:shadow-sm">
                          <FileSearch size={18} />
                        </button>
                        <button
                          onClick={() => activeTab === 'devis' ? downloadDevisPDF(item.id, item.numero) : downloadFacturePDF(item.id, item.numero)}
                          className="p-2 text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-all border border-transparent hover:border-brand-accent/20 shadow-none hover:shadow-sm"
                          title="Telecharger le PDF"
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
                    Aucun document trouve.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DevisList;
