import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api';
import {
  Leaf, Package, AlertTriangle, CheckCircle,
  Mic, Map, QrCode, Thermometer, BarChart3, TrendingUp, Shield, Zap
} from 'lucide-react';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [harvestRes] = await Promise.all([api.get('/harvest?limit=5')]);
        setRecentRecords(harvestRes.data.slice(0, 5));
        if (['fpo_admin', 'operator'].includes(user?.role)) {
          const r = await api.get('/reports/summary');
          setStats(r.data);
        }
      } catch {}
    };
    load();
  }, [user]);

  return (
    <div className="page">
      {/* Hero Banner */}
      <div className="hero-banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <Leaf size={32} color="#4ade80" />
            <span style={{ fontSize: '.85rem', fontWeight: 700, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
              Krishi-Trace AI Platform
            </span>
          </div>
          <div className="hero-title">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </div>
          <div className="hero-subtitle">
            Transparent supply chains, fair pricing, and empowered farmers — all in one platform.
          </div>
          <div className="hero-chips">
            <span className="hero-chip"><Shield size={13} /> Blockchain Secured</span>
            <span className="hero-chip"><Zap size={13} /> AI-Powered</span>
            <span className="hero-chip"><Leaf size={13} /> Fair Trade Verified</span>
          </div>
        </div>
      </div>

      {/* Admin Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon"><Package size={26} color="#3b82f6" /></div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">{t('reports.totalRecords')}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon"><CheckCircle size={26} color="#16a34a" /></div>
            <div className="stat-value">{stats.compliant}</div>
            <div className="stat-label">{t('reports.compliant')}</div>
          </div>
          <div className="stat-card red">
            <div className="stat-icon"><AlertTriangle size={26} color="#dc2626" /></div>
            <div className="stat-value">{stats.violations}</div>
            <div className="stat-label">{t('reports.violations')}</div>
          </div>
          <div className="stat-card amber">
            <div className="stat-icon"><TrendingUp size={26} color="#d97706" /></div>
            <div className="stat-value">{stats.complianceRate}%</div>
            <div className="stat-label">{t('reports.complianceRate')}</div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="section">
        <h3 className="section-title"><Zap size={18} /> Quick Actions</h3>
        <div className="quick-actions">
          {user?.role === 'farmer' && (
            <Link to="/harvest" className="quick-card green">
              <Mic size={32} />
              <span>{t('nav.harvest')}</span>
            </Link>
          )}
          <Link to="/ledger" className="quick-card blue">
            <Package size={32} />
            <span>{t('nav.ledger')}</span>
          </Link>
          <Link to="/gis" className="quick-card orange">
            <Map size={32} />
            <span>{t('nav.gis')}</span>
          </Link>
          <Link to="/scan" className="quick-card purple">
            <QrCode size={32} />
            <span>{t('nav.scan')}</span>
          </Link>
          <Link to="/iot" className="quick-card teal">
            <Thermometer size={32} />
            <span>{t('nav.iot')}</span>
          </Link>
          {['fpo_admin', 'operator'].includes(user?.role) && (
            <Link to="/reports" className="quick-card blue">
              <BarChart3 size={32} />
              <span>{t('nav.reports')}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Records */}
      {recentRecords.length > 0 && (
        <div className="section">
          <h3 className="section-title"><Leaf size={18} /> Recent Harvest Records</h3>
          <div className="record-list">
            {recentRecords.map((r) => (
              <div key={r._id} className="record-row">
                <div className="record-crop">
                  <Leaf size={18} color="#16a34a" /> {r.cropType}
                </div>
                <div className="record-qty">{r.quantity} {r.unit}</div>
                <div className="record-payout">₹{r.payoutBreakdown?.farmerPayout}/kg</div>
                <div style={{ marginLeft: 'auto' }}>
                  <span className={`badge ${r.fairPriceCompliant ? 'badge-green' : 'badge-red'}`}>
                    {r.fairPriceCompliant ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
                    {r.fairPriceCompliant ? t('ledger.compliant') : t('ledger.violation')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentRecords.length === 0 && user?.role === 'farmer' && (
        <div className="section">
          <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--gray-400)' }}>
            <Mic size={48} style={{ margin: '0 auto 16px', color: 'var(--gray-300)' }} />
            <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 8 }}>No harvests logged yet</p>
            <p style={{ fontSize: '.9rem', marginBottom: 20 }}>Use the voice assistant to log your first harvest</p>
            <Link to="/harvest" className="btn-primary">
              <Mic size={18} /> Log First Harvest
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
