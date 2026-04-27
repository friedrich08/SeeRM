import { useEffect, useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Users, Target, ArrowUpRight, ArrowDownRight, Search, Building2 } from 'lucide-react';
import api from '../lib/api';
import { formatXOF } from '../lib/currency';

type ClientStat = {
  id: number;
  nom_societe: string;
  total_revenue: number;
  opportunities_count: number;
  won_opportunities: number;
  conversion_rate: number;
  avatar_url?: string;
};

const Analytics = () => {
  const [stats, setStats] = useState<ClientStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortSortConfig] = useState<{ key: keyof ClientStat; direction: 'asc' | 'desc' }>({
    key: 'total_revenue',
    direction: 'desc',
  });

  useEffect(() => {
    api.get('/analytics-clients/')
      .then((res) => setStats(res.data))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSort = (key: keyof ClientStat) => {
    setSortSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const sortedStats = useMemo(() => {
    const filtered = stats.filter(s => 
      s.nom_societe.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
  }, [stats, searchTerm, sortConfig]);

  const topPerformer = useMemo(() => {
    return [...stats].sort((a, b) => b.total_revenue - a.total_revenue)[0];
  }, [stats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-brand-primary mb-2">Analytique Clients</h1>
        <p className="text-gray-500 text-sm">Analysez la performance et la valeur de votre portefeuille client.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Top Revenu</h3>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-bold text-brand-primary truncate max-w-[150px]">
                {topPerformer?.nom_societe || 'N/A'}
              </p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {formatXOF(topPerformer?.total_revenue || 0)}
              </p>
            </div>
            <div className="bg-green-50 text-green-600 p-1 rounded-lg">
              <ArrowUpRight size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Target size={20} />
            </div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Moy. Conversion</h3>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-bold text-brand-primary">Taux Global</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {Math.round(stats.reduce((acc, s) => acc + s.conversion_rate, 0) / (stats.length || 1))}%
              </p>
            </div>
            <div className="bg-blue-50 text-blue-600 p-1 rounded-lg">
              <BarChart3 size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <Users size={20} />
            </div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Opportunités</h3>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-bold text-brand-primary">Volume Actif</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                {stats.reduce((acc, s) => acc + s.opportunities_count, 0)}
              </p>
            </div>
            <div className="bg-rose-50 text-rose-600 p-1 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="font-bold text-brand-primary">Classement de performance</h2>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Filtrer par société..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Société</th>
                <th 
                  className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 cursor-pointer hover:text-brand-primary transition-colors"
                  onClick={() => handleSort('total_revenue')}
                >
                  Revenu Total {sortConfig.key === 'total_revenue' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 cursor-pointer hover:text-brand-primary transition-colors"
                  onClick={() => handleSort('opportunities_count')}
                >
                  Opps. {sortConfig.key === 'opportunities_count' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 cursor-pointer hover:text-brand-primary transition-colors"
                  onClick={() => handleSort('conversion_rate')}
                >
                  Taux de Conv. {sortConfig.key === 'conversion_rate' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedStats.map((stat) => (
                <tr key={stat.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-brand-primary overflow-hidden">
                        {stat.avatar_url ? (
                          <img src={stat.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 size={20} className="text-gray-400" />
                        )}
                      </div>
                      <span className="text-sm font-bold text-brand-primary">{stat.nom_societe}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-brand-primary">{formatXOF(stat.total_revenue)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-brand-primary">{stat.opportunities_count} opportunités</span>
                      <span className="text-[10px] text-gray-400">{stat.won_opportunities} gagnées</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${stat.conversion_rate}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-600">{Math.round(stat.conversion_rate)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      stat.conversion_rate > 50 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {stat.conversion_rate > 50 ? 'Performant' : 'À relancer'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
