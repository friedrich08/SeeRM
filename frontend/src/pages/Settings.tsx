import { useEffect, useState } from 'react';
import { ExternalLink, Mail, ShieldCheck } from 'lucide-react';
import api, { API_BASE_URL } from '../lib/api';

type SystemStatus = {
  admin?: { url?: string };
  email?: { configured?: boolean; backend?: string; from_email?: string };
};

const Settings = () => {
  const backendBase = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
  const [status, setStatus] = useState<SystemStatus>({});
  const [statusError, setStatusError] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  useEffect(() => {
    api
      .get('/system/status/')
      .then((response) => {
        setStatus(response.data);
        setStatusError('');
      })
      .catch((error: any) => {
        setStatusError(error?.response?.data?.detail || 'Impossible de charger le statut systeme.');
      });
  }, []);

  const handleSendTestMail = async () => {
    setEmailMessage('');
    try {
      const response = await api.post('/system/test-email/', { to_email: emailTo });
      setEmailMessage(response.data?.detail || 'Email de test envoye.');
    } catch (error: any) {
      setEmailMessage(error?.response?.data?.detail || "Echec de l'envoi de l'email.");
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-primary mb-2">Parametres</h1>
        <p className="text-gray-500 text-sm">Administration et configuration email.</p>
      </div>

      {statusError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{statusError}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="font-bold text-brand-primary flex items-center gap-2">
            <ShieldCheck size={18} />
            Administration
          </h2>
          <a
            href={`${backendBase}${status.admin?.url || '/admin/'}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-primary hover:underline"
          >
            Ouvrir l'admin Django
            <ExternalLink size={14} />
          </a>
          <p className="text-xs text-gray-400">Compte seed admin: admin@relatel.tg / Admin@12345</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="font-bold text-brand-primary flex items-center gap-2">
            <Mail size={18} />
            Email automatique
          </h2>
          <p className="text-sm text-gray-500">
            Etat: {status.email?.configured ? 'active' : 'incomplet'} ({status.email?.backend || 'backend inconnu'})
          </p>
          <input
            type="email"
            placeholder="email destinataire"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
          />
          <button onClick={handleSendTestMail} className="w-full bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-bold">
            Envoyer un mail de test
          </button>
          {emailMessage && <p className="text-xs text-gray-500">{emailMessage}</p>}
        </div>
      </div>
    </div>
  );
};

export default Settings;
