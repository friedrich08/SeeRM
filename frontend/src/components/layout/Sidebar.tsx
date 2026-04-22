import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Kanban,
  FileText,
  MessageSquare,
  Settings,
  Bell,
  Calendar,
  HelpCircle,
  Briefcase,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const NavSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="px-4 mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">{title}</h3>
    <div className="space-y-0.5">{children}</div>
  </div>
);

const SidebarItem = ({ to, icon: Icon, label, badge }: { to: string; icon: any; label: string; badge?: string | number }) => (
  <NavLink to={to}>
    {({ isActive }) => (
      <div
        className={`flex items-center justify-between px-4 py-2 rounded-xl transition-all duration-200 group ${
          isActive ? 'bg-white border border-gray-100 shadow-sm text-brand-primary font-bold' : 'text-gray-500 hover:text-brand-primary'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className="shrink-0" strokeWidth={isActive ? 2.5 : 2} />
          <span className="text-[13px] font-medium">{label}</span>
        </div>
        {badge && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">{badge}</span>}
      </div>
    )}
  </NavLink>
);

export const Sidebar = () => {
  const { user, logout, can } = useAuthStore();
  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Utilisateur';
  const roleLabel = user?.role || '-';

  return (
    <aside className="w-[260px] h-screen fixed left-0 top-0 bg-gray-50/50 border-r border-gray-100 flex flex-col z-50">
      <div className="p-6 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Briefcase size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-brand-primary leading-none">Relatel</h1>
            <span className="text-[10px] text-gray-400 font-medium tracking-wide">relatel.studio</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <NavSection title="Pilotage">
          <SidebarItem to="/" icon={LayoutDashboard} label="Tableau de bord" />
          <SidebarItem to="/calendar" icon={Calendar} label="Calendrier" />
          {can('pipeline', 'read') && <SidebarItem to="/pipeline" icon={Kanban} label="Pipeline" />}
        </NavSection>

        <NavSection title="Operations">
          <SidebarItem to="/notifications" icon={Bell} label="Notifications" badge="7" />
          {can('chat', 'read') && <SidebarItem to="/chat" icon={MessageSquare} label="Messagerie" />}
          {can('clients', 'read') && <SidebarItem to="/clients" icon={Users} label="Clients" />}
          {can('finance', 'read') && <SidebarItem to="/finance" icon={FileText} label="Finances" />}
        </NavSection>

        <NavSection title="Analytique">
          {can('pipeline', 'read') && <SidebarItem to="/active" icon={LayoutDashboard} label="Activite" />}
          {can('pipeline', 'read') && <SidebarItem to="/past" icon={Calendar} label="Historique" />}
        </NavSection>
      </nav>

      <div className="p-4 mt-auto border-t border-gray-100 space-y-4">
        <div className="space-y-0.5 px-2">
          <button className="w-full flex items-center gap-3 py-1.5 text-gray-500 hover:text-brand-primary text-[13px] font-medium transition-colors">
            <HelpCircle size={18} />
            Centre d'aide
          </button>
          {can('system', 'read') && (
            <NavLink to="/settings" className="w-full flex items-center gap-3 py-1.5 text-gray-500 hover:text-brand-primary text-[13px] font-medium transition-colors">
              <Settings size={18} />
              Parametres
            </NavLink>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 py-1.5 text-gray-500 hover:text-red-600 text-[13px] font-medium transition-colors"
          >
            <LogOut size={18} />
            Deconnexion
          </button>
        </div>

        <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`} alt="Utilisateur" className="w-9 h-9 rounded-xl bg-gray-100" />
          <div className="overflow-hidden">
            <p className="text-[12px] font-bold text-brand-primary truncate">{fullName}</p>
            <p className="text-[10px] text-gray-400 truncate">{user?.email || '-'}</p>
            <p className="text-[10px] text-gray-400 truncate">{roleLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
