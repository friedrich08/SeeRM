import { useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { ExternalLink, Globe, LogIn, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api, { API_BASE_URL } from '../lib/api';
import { Logo } from '../components/ui/Logo';

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden">
        <div className="bg-[#0b0f17] text-white p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full" />
          
          <div className="relative z-10">
            <Logo size="lg" />
            <div className="mt-12">
                <h2 className="text-4xl font-bold mb-4 tracking-tight">The future of CRM is here.</h2>
                <p className="text-gray-400 text-lg leading-relaxed">
                SeeRM provides a premium experience for modern enterprises, focusing on speed and design.
                </p>
            </div>
          </div>
          <div className="relative z-10 text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            System Operational
          </div>
        </div>

        <div className="p-12">
          <div className="flex gap-2 mb-8 bg-gray-50 rounded-2xl p-1.5 border border-gray-100">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'login' ? 'bg-white shadow-sm text-[#0b0f17] border border-gray-100' : 'text-gray-400'}`}
            >
              Connexion
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'register' ? 'bg-white shadow-sm text-[#0b0f17] border border-gray-100' : 'text-gray-400'}`}
            >
              Inscription
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={submitLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email</label>
                <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all bg-gray-50/50 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Mot de passe</label>
                <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all bg-gray-50/50 focus:bg-white"
                />
              </div>
              <button disabled={isLoading} className="w-full bg-[#0b0f17] text-white py-4 rounded-2xl font-bold flex justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-gray-200">
                <LogIn size={18} />
                Se connecter
              </button>
            </form>
          ) : (
            <form onSubmit={submitRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Prenom</label>
                    <input
                        value={registerForm.first_name}
                        onChange={(e) => setRegisterForm({ ...registerForm, first_name: e.target.value })}
                        className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all bg-gray-50/50 focus:bg-white"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nom</label>
                    <input
                        value={registerForm.last_name}
                        onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })}
                        className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all bg-gray-50/50 focus:bg-white"
                    />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email</label>
                <input
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all bg-gray-50/50 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Mot de passe</label>
                <input
                    type="password"
                    required
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all bg-gray-50/50 focus:bg-white"
                />
              </div>
              <button disabled={isLoading} className="w-full bg-[#0b0f17] text-white py-4 rounded-2xl font-bold flex justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-gray-200">
                <UserPlus size={18} />
                Creer mon compte
              </button>
            </form>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <div className="mt-8 border-t border-gray-100 pt-8">
            <a
              href={`${backendBase}${googleStatus.login_url || '/accounts/google/login/?process=login'}`}
              className="w-full rounded-2xl py-4 font-bold text-sm flex items-center justify-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
            >
              <Globe size={17} />
              Se connecter avec Google
              <ExternalLink size={14} />
            </a>
            <p className="mt-4 text-center text-[10px] text-gray-400 uppercase tracking-widest font-bold">
              Premium Enterprise CRM Solution
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
