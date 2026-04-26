import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const STATUS_COLORS = { Delivered: 'badge-green', Shipped: 'badge-blue', Processing: 'badge-yellow' };

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconPackage = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const IconLogOut = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const tabs = [
  { id: 'profile',     label: 'Profile',       icon: <IconUser /> },
  { id: 'orders',      label: 'Order History',  icon: <IconPackage /> },
  { id: 'preferences', label: 'Preferences',    icon: <IconSettings /> },
];

function userInitials(user) {
  const first = (user?.firstName || '').trim();
  const last = (user?.lastName || '').trim();
  if (first || last) return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
  return (user?.email || 'U')[0].toUpperCase();
}

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]         = useState('profile');
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({
    firstName: user.firstName,
    lastName:  user.lastName,
    email:     user.email,
    phone:     user.phone || '',
  });
  const [saved, setSaved]     = useState(false);
  const [orders, setOrders]   = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setLoadingOrders(false);
      });
  }, [user.id]);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    await updateUser({ firstName: form.firstName, lastName: form.lastName, phone: form.phone });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <main>
      <div className="profile-header">
        <div className="container">
          <span className="avatar-lg avatar-initials" aria-hidden="true">{userInitials(user)}</span>
          <div>
            <h1>{user.firstName} {user.lastName}</h1>
            <p className="text-muted">Member since {user.memberSince}</p>
          </div>
        </div>
      </div>

      <div className="container section">
        <div className="profile-layout">
          <aside className="profile-sidebar">
            {tabs.map(t => (
              <button key={t.id} className={`sidebar-btn ${tab === t.id ? 'sidebar-btn-active' : ''}`} onClick={() => setTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
            <button className="sidebar-btn sidebar-btn-danger" onClick={handleLogout}>
              <IconLogOut /> Sign Out
            </button>
          </aside>

          <div className="profile-content">
            {tab === 'profile' && (
              <div className="card">
                <div className="card-header">
                  <h2>Profile Details</h2>
                  {!editing && (
                    <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
                      <IconEdit /> Edit
                    </button>
                  )}
                </div>
                {saved && <div className="alert alert-success">Profile updated successfully!</div>}
                {editing ? (
                  <form onSubmit={handleSave} className="edit-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>First Name</label>
                        <input name="firstName" value={form.firstName} onChange={handleChange} required />
                      </div>
                      <div className="form-group">
                        <label>Last Name</label>
                        <input name="lastName" value={form.lastName} onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Email</label>
                        <input name="email" type="email" value={form.email} disabled className="input-disabled" />
                      </div>
                      <div className="form-group">
                        <label>Phone</label>
                        <input name="phone" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">Save Changes</button>
                      <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="profile-fields">
                    <div className="form-row">
                      <div className="form-group"><label>First Name</label><div className="field-val">{user.firstName}</div></div>
                      <div className="form-group"><label>Last Name</label><div className="field-val">{user.lastName}</div></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Email</label><div className="field-val">{user.email}</div></div>
                      <div className="form-group"><label>Phone</label><div className="field-val">{user.phone || '—'}</div></div>
                    </div>
                    <div className="form-group"><label>Role</label><div className="field-val">{user.role}</div></div>
                  </div>
                )}
              </div>
            )}

            {tab === 'orders' && (
              <div className="card">
                <h2>Order History</h2>
                {loadingOrders ? (
                  <p className="text-muted">Loading orders...</p>
                ) : (
                  <table className="order-table">
                    <thead>
                      <tr><th>Order ID</th><th>Date</th><th>Status</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                      {orders.length > 0 ? orders.map(o => (
                        <tr key={o.id}>
                          <td className="text-muted text-sm">{o.id.slice(0, 8)}&hellip;</td>
                          <td>{new Date(o.created_at).toLocaleDateString()}</td>
                          <td><span className={`badge ${STATUS_COLORS[o.status] || 'badge-gray'}`}>{o.status}</span></td>
                          <td>${Number(o.total).toFixed(2)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="text-center text-muted">No orders yet</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {tab === 'preferences' && (
              <div className="card">
                <h2>Preferences</h2>
                <div className="form-group">
                  <label>Email Notifications</label>
                  <label className="toggle"><input type="checkbox" defaultChecked /> Order updates</label>
                  <label className="toggle"><input type="checkbox" defaultChecked /> Promotions &amp; deals</label>
                  <label className="toggle"><input type="checkbox" /> New product alerts</label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
