import { useEffect, useState, useRef } from 'react';
import { User, Lock, Save, Loader2, CheckCircle2, Image as ImageIcon, Upload } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

const Settings = () => {
  const { user, fetchMe } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile state
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url || '',
  });
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirm_password: '',
  });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        avatar_url: user.avatar_url || '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage({ text: '', type: '' });
    setIsUpdatingProfile(true);
    try {
      await api.patch('/auth/me/', {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        avatar_url: profileData.avatar_url,
      });
      await fetchMe();
      setProfileMessage({ text: 'Profil mis à jour avec succès.', type: 'success' });
    } catch (error: any) {
      setProfileMessage({ 
        text: error?.response?.data?.detail || 'Erreur lors de la mise à jour du profil.', 
        type: 'error' 
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });
    
    if (passwordData.password !== passwordData.confirm_password) {
      setPasswordMessage({ text: 'Les mots de passe ne correspondent pas.', type: 'error' });
      return;
    }

    if (passwordData.password.length < 8) {
      setPasswordMessage({ text: 'Le mot de passe doit contenir au moins 8 caractères.', type: 'error' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await api.patch('/auth/me/', { password: passwordData.password });
      setPasswordData({ password: '', confirm_password: '' });
      setPasswordMessage({ text: 'Mot de passe mis à jour avec succès.', type: 'success' });
    } catch (error: any) {
      setPasswordMessage({ 
        text: error?.response?.data?.detail || 'Erreur lors de la mise à jour du mot de passe.', 
        type: 'error' 
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setIsUploading(true);
    setProfileMessage({ text: '', type: '' });
    try {
      const response = await api.post('/auth/upload-avatar/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setProfileData(prev => ({ ...prev, avatar_url: response.data.avatar_url }));
      await fetchMe();
      setProfileMessage({ text: 'Photo mise à jour avec succès.', type: 'success' });
    } catch (error: any) {
      setProfileMessage({ 
        text: error?.response?.data?.detail || "Erreur lors de l'upload de la photo.", 
        type: 'error' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = () => {
    const first = profileData.first_name?.charAt(0) || '';
    const last = profileData.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-primary mb-2">Paramètres</h1>
        <p className="text-gray-500 text-sm">Gérez votre profil et votre sécurité.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Section */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50">
            <h2 className="font-bold text-brand-primary flex items-center gap-2">
              <User size={20} className="text-indigo-600" />
              Mon Profil
            </h2>
            <p className="text-xs text-gray-500 mt-1">Mettez à jour vos informations personnelles.</p>
          </div>
          <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl overflow-hidden border-2 border-white shadow-sm relative group">
                  {profileData.avatar_url ? (
                    <img src={profileData.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    getInitials()
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Loader2 size={24} className="text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all disabled:opacity-50"
                  >
                    <Upload size={16} />
                    {profileData.avatar_url ? 'Changer de photo' : 'Uploader une photo'}
                  </button>
                  <p className="text-[10px] text-gray-400 font-medium">PNG, JPG ou GIF. Max 2Mo.</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <ImageIcon size={12} />
                  Ou URL de la photo
                </label>
                <input
                  type="text"
                  value={profileData.avatar_url}
                  onChange={(e) => setProfileData({ ...profileData, avatar_url: e.target.value })}
                  placeholder="https://exemple.com/ma-photo.jpg"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Prénom</label>
                <input
                  type="text"
                  value={profileData.first_name}
                  onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Nom</label>
                <input
                  type="text"
                  value={profileData.last_name}
                  onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Adresse E-mail</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            
            {profileMessage.text && (
              <div className={`text-xs p-3 rounded-lg flex items-center gap-2 ${
                profileMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {profileMessage.type === 'success' && <CheckCircle2 size={14} />}
                {profileMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {isUpdatingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Enregistrer les modifications
            </button>
          </form>
        </div>

        {/* Security Section */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50">
            <h2 className="font-bold text-brand-primary flex items-center gap-2">
              <Lock size={20} className="text-amber-500" />
              Sécurité
            </h2>
            <p className="text-xs text-gray-500 mt-1">Changez votre mot de passe pour sécuriser votre compte.</p>
          </div>
          <form onSubmit={handleUpdatePassword} className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Nouveau mot de passe</label>
              <input
                type="password"
                value={passwordData.password}
                onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Confirmer le mot de passe</label>
              <input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {passwordMessage.text && (
              <div className={`text-xs p-3 rounded-lg flex items-center gap-2 ${
                passwordMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {passwordMessage.type === 'success' && <CheckCircle2 size={14} />}
                {passwordMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-900 transition-all disabled:opacity-50"
            >
              {isUpdatingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              Mettre à jour le mot de passe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
