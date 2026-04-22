import React, { useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { MessageCircle, GitCommit, Layout, TrendingUp } from 'lucide-react';
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
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend
);

const MetricCard = ({ title, value, icon: Icon, children, color }: any) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-gray-400" />
        <h3 className="text-[13px] font-bold text-brand-primary">{title}</h3>
      </div>
      <div className="flex gap-1">
        <div className="w-1 h-1 rounded-full bg-gray-200" />
        <div className="w-1 h-1 rounded-full bg-gray-200" />
        <div className="w-1 h-1 rounded-full bg-gray-200" />
      </div>
    </div>
    <div className="flex items-end gap-3 mb-4">
      <span className="text-3xl font-bold tracking-tight">{value}</span>
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{title.split(' ')[0]}</span>
    </div>
    <div className="flex-1 min-h-[60px]">
      {children}
    </div>
  </div>
);

const Dashboard = () => {
  const { stats, fetchStats } = useDashboardStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-brand-primary mb-2">Tasks report</h1>
        <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
          Stay on top of your tasks, monitor progress, and track status. Streamline your 
          workflow and transform how you deliver results.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <MetricCard title="Task status" value={stats.new_clients} icon={Layout}>
          <div className="w-full h-full bg-gradient-to-r from-purple-100 via-indigo-100 to-blue-100 rounded-lg opacity-60" />
        </MetricCard>

        <MetricCard title="Comments" value="109" icon={MessageCircle}>
          <div className="flex items-end gap-1 h-full pt-4">
            {[30, 45, 25, 60, 40, 70, 50].map((h, i) => (
                <div key={i} className="flex-1 bg-indigo-500/20 rounded-t-sm transition-all hover:bg-indigo-500" style={{ height: `${h}%` }} />
            ))}
          </div>
        </MetricCard>

        <MetricCard title="Burndown chart" value="120" icon={TrendingUp}>
            <div className="h-full w-full">
                <Line 
                    data={{
                        labels: ['', '', '', '', ''],
                        datasets: [{
                            data: [120, 100, 80, 45, 30],
                            borderColor: '#6366f1',
                            borderWidth: 2,
                            pointRadius: 0,
                            tension: 0.4
                        }]
                    }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { x: { display: false }, y: { display: false } }
                    }}
                />
            </div>
        </MetricCard>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-gray-100 mb-8">
        {['Spreadsheet', 'Board', 'Calendar', 'Timeline'].map((tab, i) => (
            <button key={tab} className={`pb-4 text-[13px] font-bold transition-all relative ${i === 1 ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}>
                {tab}
                {i === 1 && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary" />}
            </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-soft min-h-[400px] flex items-center justify-center">
        <p className="text-gray-300 font-medium italic">Detailed reports coming soon...</p>
      </div>
    </div>
  );
};

export default Dashboard;
