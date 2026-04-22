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
  ChevronDown,
  Calendar,
  HelpCircle,
  Briefcase
} from 'lucide-react';

const NavSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="px-4 mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
      {title}
    </h3>
    <div className="space-y-0.5">
      {children}
    </div>
  </div>
);

const SidebarItem = ({ to, icon: Icon, label, badge }: { to: string, icon: any, label: string, badge?: string | number }) => (
  <NavLink to={to}>
    {({ isActive }) => (
      <div className={`flex items-center justify-between px-4 py-2 rounded-xl transition-all duration-200 group ${
        isActive 
          ? 'bg-white border border-gray-100 shadow-sm text-brand-primary font-bold' 
          : 'text-gray-500 hover:text-brand-primary'
      }`}>
        <div className="flex items-center gap-3">
          <Icon size={18} className="shrink-0" strokeWidth={isActive ? 2.5 : 2} />
          <span className="text-[13px] font-medium">{label}</span>
        </div>
        {badge && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            {badge}
          </span>
        )}
      </div>
    )}
  </NavLink>
);

export const Sidebar = () => {
  return (
    <aside className="w-[260px] h-screen fixed left-0 top-0 bg-gray-50/50 border-r border-gray-100 flex flex-col z-50">
      {/* Header / Logo */}
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

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3">
        <NavSection title="Overview">
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem to="/calendar" icon={Calendar} label="Calendar" />
          <SidebarItem to="/pipeline" icon={Kanban} label="Tasks" />
        </NavSection>

        <NavSection title="Tools">
          <SidebarItem to="/notifications" icon={Bell} label="Notification" badge="7" />
          <SidebarItem to="/chat" icon={MessageSquare} label="Inbox" />
          <SidebarItem to="/clients" icon={Users} label="Contacts" />
          <SidebarItem to="/finance" icon={FileText} label="Reporting" />
        </NavSection>

        <NavSection title="Metrics">
          <SidebarItem to="/active" icon={LayoutDashboard} label="Active" />
          <SidebarItem to="/past" icon={Calendar} label="Past" />
        </NavSection>
      </nav>

      {/* Footer / User */}
      <div className="p-4 mt-auto border-t border-gray-100 space-y-4">
        <div className="space-y-0.5 px-2">
            <button className="w-full flex items-center gap-3 py-1.5 text-gray-500 hover:text-brand-primary text-[13px] font-medium transition-colors">
                <HelpCircle size={18} />
                Help Center
            </button>
            <button className="w-full flex items-center gap-3 py-1.5 text-gray-500 hover:text-brand-primary text-[13px] font-medium transition-colors">
                <Settings size={18} />
                Settings
            </button>
        </div>

        <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jean" 
            alt="User" 
            className="w-9 h-9 rounded-xl bg-gray-100"
          />
          <div className="overflow-hidden">
            <p className="text-[12px] font-bold text-brand-primary truncate">Jean Dupont</p>
            <p className="text-[10px] text-gray-400 truncate">jean@relatel.fr</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
