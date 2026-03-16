import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Mic, BookOpen, Map, Thermometer,
  BarChart3, QrCode, LogOut, Leaf, Globe
} from 'lucide-react';
import api from '../api';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ta', label: 'தமிழ்' },
];

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLangChange = async (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
    try { await api.patch('/auth/language', { language: lang }); } catch {}
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: t('nav.dashboard') },
    ...(user?.role === 'farmer' ? [{ to: '/harvest', icon: <Mic size={20} />, label: t('nav.harvest') }] : []),
    { to: '/ledger', icon: <BookOpen size={20} />, label: t('nav.ledger') },
    { to: '/scan', icon: <QrCode size={20} />, label: t('nav.scan') },
    { to: '/gis', icon: <Map size={20} />, label: t('nav.gis') },
    { to: '/iot', icon: <Thermometer size={20} />, label: t('nav.iot') },
    ...(['fpo_admin', 'operator'].includes(user?.role) ? [{ to: '/reports', icon: <BarChart3 size={20} />, label: t('nav.reports') }] : []),
  ];

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Leaf size={28} className="brand-icon" />
          <div className="brand-text">
            <span className="brand-name">{t('appName')}</span>
            <span className="brand-sub">Supply Chain Platform</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="lang-selector">
            <Globe size={16} />
            <select value={i18n.language} onChange={(e) => handleLangChange(e.target.value)}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div>
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role?.replace('_', ' ')}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={17} /> <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
