import { useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { Layout, TrendingUp, Users, Target, BarChart3 } from 'lucide-react';
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

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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
      label: 'Revenus',
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
        <MetricCard title="Revenus encaisses" value={formatXOF(stats.kpi.total_revenue)} icon={TrendingUp} subtext="Factures reglees">
            <Line data={revenueData} options={{ 
                responsive: true, maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
            }} />
        </MetricCard>

        <MetricCard title="Valeur du pipeline" value={formatXOF(stats.kpi.pipeline_value)} icon={Target} subtext="Opportunites actives">
            <Bar data={oppData} options={{ 
                responsive: true, maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
            }} />
        </MetricCard>

        <MetricCard title="Nouveaux clients" value={stats.kpi.new_clients} icon={Users} subtext="Total clients et prospects">
            <div className="flex items-center justify-center h-full">
                <BarChart3 size={48} className="text-indigo-100" />
            </div>
        </MetricCard>

        <MetricCard title="Taux de conversion" value={`${stats.kpi.conversion_rate}%`} icon={Layout} subtext="Opportunites gagnees">
            <div className="w-full bg-gray-100 rounded-full h-2.5 mt-4">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${stats.kpi.conversion_rate}%` }}></div>
            </div>
        </MetricCard>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-brand-primary mb-6 flex items-center gap-2">
            <KanbanIcon size={20} className="text-brand-accent" />
            Vue du pipeline
        </h2>
        <Kanban hideHeader />
      </div>
    </div>
  );
};

const KanbanIcon = Layout;

export default Dashboard;
