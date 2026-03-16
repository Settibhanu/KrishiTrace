import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Leaf, Loader2 } from 'lucide-react';

const ROLES = ['farmer', 'operator', 'fpo_admin'];
const LANGUAGES = [
  { code: 'en', label: 'English' }, { code: 'hi', label: 'हिंदी' },
  { code: 'kn', label: 'ಕನ್ನಡ' }, { code: 'te', label: 'తెలుగు' }, { code: 'ta', label: 'தமிழ்' },
];

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', mobile: '', password: '', role: 'farmer', language: 'en', farmAddress: '', lat: '', lng: '' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <div className="auth-brand">
          <Leaf size={36} className="brand-icon" />
          <h1>{t('appName')}</h1>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>{t('auth.name')}</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>{t('auth.mobile')}</label>
              <input type="tel" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t('auth.password')}</label>
              <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>{t('auth.role')}</label>
              <select value={form.role} onChange={(e) => set('role', e.target.value)}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t('auth.language')}</label>
              <select value={form.language} onChange={(e) => set('language', e.target.value)}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>{t('auth.farmAddress')}</label>
              <input value={form.farmAddress} onChange={(e) => set('farmAddress', e.target.value)} placeholder="Village, District, State" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Latitude</label>
              <input type="number" step="any" value={form.lat} onChange={(e) => set('lat', e.target.value)} placeholder="12.9716" />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input type="number" step="any" value={form.lng} onChange={(e) => set('lng', e.target.value)} placeholder="77.5946" />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 size={18} className="spin" /> : t('auth.registerBtn')}
          </button>
        </form>
        <p className="auth-switch">
          {t('auth.hasAccount')} <Link to="/login">{t('auth.loginBtn')}</Link>
        </p>
      </div>
    </div>
  );
}
