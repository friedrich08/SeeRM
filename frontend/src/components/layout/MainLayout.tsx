import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Search, Share2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { can, user } = useAuthStore();
  const isClient = user?.role === 'CLIENT';

  const mobileNavItems = [
    { path: isClient ? '/portal' : '/dashboard', label: isClient ? 'Portail' : 'Dashboard', visible: true },
    { path: '/clients', label: 'Clients', visible: !isClient && can('clients', 'read') },
    { path: '/pipeline', label: 'Pipeline', visible: !isClient && can('pipeline', 'read') },
    { path: '/finance', label: 'Finance', visible: !isClient && can('finance', 'read') },
    { path: '/chat', label: 'Chat', visible: !isClient && can('chat', 'read') },
  ].filter((item) => item.visible);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Sidebar />
      
      <div className="flex flex-col min-h-screen lg:ml-[260px]">
        {/* Header */}
        <header className="h-16 px-4 sm:px-6 lg:px-8 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-40 border-b border-gray-100/50">
          <div className="flex items-center gap-4 text-gray-400 text-xs">
            <span>CRM</span>
            <span>/</span>
            <span className="text-brand-primary font-medium">Vue operationnelle</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher" 
                className="bg-gray-100/50 border-none rounded-lg py-1.5 pl-10 pr-4 text-xs w-64 focus:ring-1 focus:ring-gray-200 transition-all outline-none"
              />
            </div>
            
            <button className="p-2 text-gray-400 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-gray-100">
              <Share2 size={16} />
            </button>
          </div>
        </header>
        <div className="flex gap-2 overflow-x-auto border-b border-gray-100 bg-white px-4 py-2 lg:hidden">
          {mobileNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold ${
                location.pathname.startsWith(item.path) ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
