import { useEffect, useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { usePipelineStore } from '../store/usePipelineStore';
import { Layout, TrendingUp, Users, Target, BarChart3, Calendar as CalendarIcon, List, Clock } from 'lucide-react';
import { formatXOF } from '../lib/currency';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import Kanban from './Kanban';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend
);

const MetricCard = ({ title, value, subtext, icon: Icon, children }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-50 rounded-xl text-brand-primary">
          <Icon size={20} />
        </div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
      </div>
    </div>
    <div className="mb-4">
      <span className="text-3xl font-bold tracking-tight text-brand-primary">{value}</span>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
    <div className="flex-1 min-h-[100px]">
      {children}
    </div>
  </div>
);

const Dashboard = () => {
  const { stats, fetchStats, isLoading } = useDashboardStore();
  const { opportunities, fetchOpportunities } = usePipelineStore();
  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'board' | 'calendar' | 'timeline'>('spreadsheet');

  useEffect(() => {
    fetchStats();
    fetchOpportunities();
  }, [fetchStats, fetchOpportunities]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  const revenueData = {
    labels: stats.revenue_trend.map(d => d.month),
    datasets: [{
      label: 'Revenu',
      data: stats.revenue_trend.map(d => d.revenue),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
    }]
  };

  const oppData = {
    labels: ['Prospect', 'Qualif', 'Prop', 'Negoc', 'Gagne'],
    datasets: [{
      label: 'Opportunites',
      data: [
        stats.opportunity_stats.prospect,
        stats.opportunity_stats.qualification,
        stats.opportunity_stats.proposition,
        stats.opportunity_stats.negociation,
        stats.opportunity_stats.gagne,
      ],
      backgroundColor: [
        '#f3f4f6',
        '#e0e7ff',
        '#c7d2fe',
        '#a5b4fc',
        '#6366f1',
      ],
      borderRadius: 8,
    }]
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-brand-primary mb-2">Tableau de bord</h1>
        <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
          Suivez vos performances commerciales, votre pipeline et vos revenus en temps reel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <MetricCard title="Revenu encaisse" value={formatXOF(stats.kpi.total_revenue)} icon={TrendingUp} subtext="Factures payees">
            <Line data={revenueData} options={{ 
                responsive: true, maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
            }} />
        </MetricCard>

        <MetricCard title="Valeur Pipeline" value={formatXOF(stats.kpi.pipeline_value)} icon={Target} subtext="Opportunites actives">
            <Bar data={oppData} options={{ 
                responsive: true, maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
            }} />
        </MetricCard>

        <MetricCard title="Nouveaux Clients" value={stats.kpi.new_clients} icon={Users} subtext="Total clients & prospects">
            <div className="flex items-center justify-center h-full">
                <BarChart3 size={48} className="text-indigo-100" />
            </div>
        </MetricCard>

        <MetricCard title="Taux Conversion" value={`${stats.kpi.conversion_rate}%`} icon={Layout} subtext="Opportunites gagnees">
            <div className="w-full bg-gray-100 rounded-full h-2.5 mt-4">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${stats.kpi.conversion_rate}%` }}></div>
            </div>
        </MetricCard>
      </div>

      <div className="flex gap-8 border-b border-gray-100 mb-8">
        {[
            { id: 'spreadsheet', label: 'Spreadsheet', icon: List },
            { id: 'board', label: 'Board', icon: Layout },
            { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
            { id: 'timeline', label: 'Timeline', icon: Clock },
        ].map((tab) => (
            <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 text-[13px] font-bold transition-all flex items-center gap-2 relative ${activeTab === tab.id ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <tab.icon size={14} />
                {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary" />}
            </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'spreadsheet' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Opportunite</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Client</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Montant</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Statut</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Priorite</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {opportunities.map(opt => (
                            <tr key={opt.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-bold text-brand-primary">{opt.titre}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{opt.client_detail?.nom_societe}</td>
                                <td className="px-6 py-4 text-sm font-bold">{formatXOF(opt.montant_estime)}</td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 uppercase">
                                        {opt.statut}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                        opt.priorite === 'HIGH' ? 'bg-red-50 text-red-600' : 
                                        opt.priorite === 'NORMAL' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'
                                    }`}>
                                        {opt.priorite}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'board' && <Kanban hideHeader />}

        {activeTab === 'calendar' && (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
                <CalendarIcon size={48} className="mx-auto text-gray-200 mb-4" />
                <h3 className="text-lg font-bold text-brand-primary mb-2">Calendrier des echeances</h3>
                <div className="grid grid-cols-7 gap-2 max-w-2xl mx-auto mt-6">
                    {Array.from({ length: 31 }).map((_, i) => (
                        <div key={i} className="aspect-square border border-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors">
                            {i + 1}
                            {opportunities.some(o => o.date_echeance && new Date(o.date_echeance).getDate() === i + 1) && (
                                <div className="absolute w-1 h-1 bg-indigo-500 rounded-full translate-y-3"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'timeline' && (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                    {opportunities.slice(0, 5).map((opt, i) => (
                        <div key={i} className="flex gap-6 relative">
                            <div className="w-6 h-6 rounded-full bg-white border-4 border-indigo-500 z-10 shadow-sm" />
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                                    {opt.date_echeance ? new Date(opt.date_echeance).toLocaleDateString('fr-FR') : 'Sans date'}
                                </p>
                                <h4 className="font-bold text-brand-primary">{opt.titre}</h4>
                                <p className="text-sm text-gray-500">{opt.client_detail?.nom_societe} - {formatXOF(opt.montant_estime)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
