import React from 'react';
import { Sidebar } from './Sidebar';
import { Search, Share2, Plus } from 'lucide-react';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Sidebar />
      
      <div className="ml-[260px] flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 px-8 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-40 border-b border-gray-100/50">
          <div className="flex items-center gap-4 text-gray-400 text-xs">
            <span>CRM</span>
            <span>/</span>
            <span className="text-brand-primary font-medium">Vue operationnelle</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher" 
                className="bg-gray-100/50 border-none rounded-lg py-1.5 pl-10 pr-4 text-xs w-64 focus:ring-1 focus:ring-gray-200 transition-all outline-none"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-400 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-gray-100">
                <Share2 size={16} />
              </button>
              <button className="bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                <Plus size={14} />
                Creer une tache
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-8 flex-1">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
