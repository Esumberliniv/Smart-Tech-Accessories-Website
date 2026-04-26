import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(null); // { firstName, lastName, email }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const result = await register(form);
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    if (result.needsConfirmation) {
      setConfirmed({ firstName: form.firstName, lastName: form.lastName, email: form.email });
    } else {
      navigate('/');
    }
  }

  if (confirmed) {
    return (
      <main className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <Link to="/" className="auth-brand">
            <span className="brand-mark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4.5 13.5H11L10.5 22 20 10h-6.5z"/></svg>
            </span>
            SmartTech
          </Link>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 16px' }}>
            <span style={{ width: 60, height: 60, background: '#EFF6FF', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
          </div>
          <h1 style={{ fontSize: '1.4rem', marginBottom: 8 }}>Check your email</h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: 20 }}>
            We sent a confirmation link to
          </p>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, fontSize: '14px' }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{confirmed.firstName} {confirmed.lastName}</div>
            <div style={{ color: 'var(--accent)' }}>{confirmed.email}</div>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.6, marginBottom: 24 }}>
            Click the link in the email to activate your account. If you don't see it, check your spam folder.
          </p>
          <Link to="/login" className="btn btn-primary btn-full">Go to Sign In</Link>
          <p className="auth-footer">
            Wrong email? <button className="link" style={{ background: 'none', border: 'none', padding: 0 }} onClick={() => setConfirmed(null)}>Go back</button>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-brand">
            <span className="brand-mark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4.5 13.5H11L10.5 22 20 10h-6.5z"/></svg>
            </span>
            SmartTech
          </Link>
          <h1>Create account</h1>
          <p>Join SmartTech today</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input id="firstName" name="firstName" type="text" required placeholder="John" value={form.firstName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input id="lastName" name="lastName" type="text" required placeholder="Doe" value={form.lastName} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" required placeholder="you@example.com" value={form.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required placeholder="Min. 6 characters" value={form.password} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="confirm">Confirm Password</label>
            <input id="confirm" name="confirm" type="password" required placeholder="Re-enter password" value={form.confirm} onChange={handleChange} />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login" className="link">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
