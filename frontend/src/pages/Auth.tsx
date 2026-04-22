import { useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Briefcase, ExternalLink, Globe, LogIn, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api, { API_BASE_URL } from '../lib/api';

const Auth = () => {
  const { isAuthenticated, isLoading, error, login, register, completeSocialAuth } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [googleStatus, setGoogleStatus] = useState<{ configured?: boolean; login_url?: string; note?: string }>({});
  const [googleInfo, setGoogleInfo] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });
  const backendBase = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

  useEffect(() => {
    api
      .get('/system/status/')
      .then((response) => setGoogleStatus(response.data?.google_oauth || {}))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access = params.get('access');
    const refresh = params.get('refresh');
    const googleError = params.get('google_error');
    if (googleError) {
      setGoogleInfo('La connexion Google a echoue.');
    }
    if (access && refresh) {
      completeSocialAuth(access, refresh).then(() => {
        window.history.replaceState({}, document.title, '/auth');
      });
    }
  }, [completeSocialAuth]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    await login(loginForm.email, loginForm.password);
  };

  const submitRegister = async (event: FormEvent) => {
    event.preventDefault();
    await register(registerForm);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-brand-primary text-white p-10 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <Briefcase size={26} />
            <h1 className="text-2xl font-bold">Relatel CRM</h1>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-3">Acces securise</h2>
            <p className="text-white/80 text-sm">
              Chaque utilisateur travaille dans sa session et sur ses propres donnees.
            </p>
          </div>
          <div className="text-xs text-white/70">Connexion requise pour toutes les fonctionnalites.</div>
        </div>

        <div className="p-10">
          <div className="flex gap-2 mb-6 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold ${mode === 'login' ? 'bg-white shadow text-brand-primary' : 'text-gray-500'}`}
            >
              Connexion
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold ${mode === 'register' ? 'bg-white shadow text-brand-primary' : 'text-gray-500'}`}
            >
              Inscription
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={submitLogin} className="space-y-4">
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <input
                type="email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
              <label className="block text-sm font-medium text-gray-600">Mot de passe</label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
              <button disabled={isLoading} className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold flex justify-center gap-2">
                <LogIn size={18} />
                Se connecter
              </button>
            </form>
          ) : (
            <form onSubmit={submitRegister} className="space-y-4">
              <label className="block text-sm font-medium text-gray-600">Prenom</label>
              <input
                value={registerForm.first_name}
                onChange={(e) => setRegisterForm({ ...registerForm, first_name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
              <label className="block text-sm font-medium text-gray-600">Nom</label>
              <input
                value={registerForm.last_name}
                onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <input
                type="email"
                required
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
              <label className="block text-sm font-medium text-gray-600">Mot de passe</label>
              <input
                type="password"
                required
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
              <button disabled={isLoading} className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold flex justify-center gap-2">
                <UserPlus size={18} />
                Creer mon compte
              </button>
            </form>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <div className="mt-5 border-t border-gray-100 pt-5">
            <a
              href={`${backendBase}${googleStatus.login_url || '/accounts/google/login/?process=login'}`}
              className={`w-full rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2 border ${
                googleStatus.configured ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-amber-300 text-amber-700 bg-amber-50'
              }`}
            >
              <Globe size={17} />
              Se connecter avec Google
              <ExternalLink size={14} />
            </a>
            <p className="mt-2 text-xs text-gray-500">
              {googleStatus.configured ? 'Google OAuth configure.' : googleStatus.note || 'Google OAuth non configure.'}
            </p>
            {googleInfo && <p className="mt-1 text-xs text-red-600">{googleInfo}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
