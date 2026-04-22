import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useClientStore } from '../../store/useClientStore';

export const ClientModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { addClient } = useClientStore();
  const [formData, setFormData] = useState({
    nom_societe: '',
    email_principal: '',
    telephone: '',
    siret: '',
    adresse: '',
    type_client: 'PROSPECT'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addClient(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-primary/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-50 bg-bg-light">
          <h2 className="text-xl font-bold">Nouveau Client</h2>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-brand-secondary ml-1">Nom de la société *</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all outline-none"
              placeholder="Ex: Relatel SAS"
              value={formData.nom_societe}
              onChange={e => setFormData({...formData, nom_societe: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-brand-secondary ml-1">Email Principal *</label>
              <input 
                required
                type="email" 
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all outline-none"
                placeholder="contact@societe.fr"
                value={formData.email_principal}
                onChange={e => setFormData({...formData, email_principal: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-brand-secondary ml-1">Téléphone</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all outline-none"
                placeholder="01 23 45 67 89"
                value={formData.telephone}
                onChange={e => setFormData({...formData, telephone: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-brand-secondary ml-1">Type de client</label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all outline-none appearance-none"
              value={formData.type_client}
              onChange={e => setFormData({...formData, type_client: e.target.value as any})}
            >
              <option value="PROSPECT">Prospect</option>
              <option value="CLIENT">Client</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-brand-secondary ml-1">Adresse</label>
            <textarea 
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all outline-none resize-none"
              rows={3}
              placeholder="123 rue de la Paix, Paris"
              value={formData.adresse}
              onChange={e => setFormData({...formData, adresse: e.target.value})}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-bold text-brand-secondary border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-brand-primary shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Créer le client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
