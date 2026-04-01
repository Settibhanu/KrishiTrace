import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Leaf, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ mobile: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.mobile, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon-wrap">
            <Leaf size={32} color="#fff" />
          </div>
          <h1>{t('appName')}</h1>
          <p>{t('tagline')}</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="mobile">{t('auth.mobile')}</label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              required
              placeholder="9000000001"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
            {loading ? <Loader2 size={20} className="spin" /> : t('auth.loginBtn')}
          </button>
        </form>
        <div className="auth-divider"><span>Demo Credentials</span></div>
        <div style={{ background: 'var(--green-50)', border: '1px solid var(--green-200)', borderRadius: 10, padding: '14px 16px', fontSize: '.875rem', color: 'var(--green-800)', lineHeight: 2 }}>
          <strong>Farmer:</strong> 9000000001 / demo1234<br />
          <strong>Operator:</strong> 9000000002 / demo1234<br />
          <strong>FPO Admin:</strong> 9000000003 / demo1234
        </div>
        <p className="auth-switch">
          {t('auth.noAccount')} <Link to="/register">{t('auth.registerBtn')}</Link>
        </p>
      </div>
    </div>
  );
}
