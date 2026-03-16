import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../api';
import { BarChart3, CheckCircle, AlertTriangle, TrendingUp, Download } from 'lucide-react';

export default function ReportsPage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/reports/summary'), api.get('/reports/trends')])
      .then(([s, tr]) => { setSummary(s.data); setTrends(tr.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const downloadCSV = () => {
    if (!summary?.violationsList) return;
    const rows = [['Farmer', 'Crop', 'Payout', 'Final Price', 'Date', 'TX Hash']];
    summary.violationsList.forEach((v) => rows.push([v.farmerName, v.cropType, v.payoutBreakdown?.farmerPayout, v.payoutBreakdown?.finalConsumerPrice, new Date(v.createdAt).toLocaleDateString(), v.txHash]));
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'violations_report.csv'; a.click();
  };

  if (loading) return <div className="page"><div className="loading-state">{t('common.loading')}</div></div>;

  const cropChartData = summary?.byCrop?.map((c) => ({ name: c._id, avgPayout: Math.round(c.avgPayout), count: c.count, compliance: Math.round((c.compliantCount / c.count) * 100) })) || [];

  const trendChartData = trends.reduce((acc, t) => {
    const key = `${t._id.year}-${String(t._id.month).padStart(2, '0')}`;
    const existing = acc.find((a) => a.month === key);
    if (existing) { existing[t._id.cropType] = Math.round(t.avgPayout); }
    else { acc.push({ month: key, [t._id.cropType]: Math.round(t.avgPayout) }); }
    return acc;
  }, []);

  const cropTypes = [...new Set(trends.map((t) => t._id.cropType))];
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title"><BarChart3 size={22} /> {t('reports.title')}</h2>
        <button className="btn-secondary" onClick={downloadCSV}><Download size={16} /> {t('reports.download')}</button>
      </div>

      {summary && (
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-value">{summary.total}</div><div className="stat-label">{t('reports.totalRecords')}</div></div>
          <div className="stat-card green"><div className="stat-value">{summary.compliant}</div><div className="stat-label">{t('reports.compliant')}</div></div>
          <div className="stat-card red"><div className="stat-value">{summary.violations}</div><div className="stat-label">{t('reports.violations')}</div></div>
          <div className="stat-card blue"><div className="stat-value">{summary.complianceRate}%</div><div className="stat-label">{t('reports.complianceRate')}</div></div>
        </div>
      )}

      {cropChartData.length > 0 && (
        <div className="chart-card">
          <h3>{t('reports.byCrop')}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cropChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgPayout" fill="#10b981" name="Avg Payout (₹/kg)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="compliance" fill="#3b82f6" name="Compliance %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {trendChartData.length > 0 && (
        <div className="chart-card">
          <h3>{t('reports.trends')}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {cropTypes.map((crop, i) => <Line key={crop} type="monotone" dataKey={crop} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {summary?.violationsList?.length > 0 && (
        <div className="section">
          <h3 className="section-title"><AlertTriangle size={16} /> Violations</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Farmer</th><th>Crop</th><th>Payout</th><th>Min Required</th><th>Date</th></tr></thead>
              <tbody>
                {summary.violationsList.map((v) => (
                  <tr key={v._id}>
                    <td>{v.farmerName}</td>
                    <td>{v.cropType}</td>
                    <td className="red">₹{v.payoutBreakdown?.farmerPayout}/kg</td>
                    <td>—</td>
                    <td>{new Date(v.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
