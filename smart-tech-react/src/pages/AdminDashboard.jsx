import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

function AdminNav() {
  const { pathname } = useLocation();
  const active = p => pathname === p ? 'admin-subnav-link active' : 'admin-subnav-link';
  return (
    <div className="admin-subnav">
      <Link to="/admin"          className={active('/admin')}>Dashboard</Link>
      <Link to="/admin/products" className={active('/admin/products')}>Products</Link>
      <Link to="/admin/users"    className={active('/admin/users')}>Users</Link>
    </div>
  );
}

export { AdminNav };

const STATUS_COLORS = { Delivered: 'badge-green', Shipped: 'badge-blue', Processing: 'badge-yellow', Cancelled: 'badge-red' };

function LiveBadge({ connected }) {
  return (
    <span className={`live-badge ${connected ? 'live-badge-on' : 'live-badge-off'}`}>
      <span className={`live-dot ${connected ? 'live-dot-pulse' : ''}`} />
      {connected ? 'Live' : 'Connecting…'}
    </span>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-num" style={color ? { color } : {}}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats]       = useState({ revenue: 0, orders: 0, users: 0, lowStock: 0 });
  const [activity, setActivity] = useState([]);
  const [connected, setConnected] = useState(false);
  const [newIds, setNewIds]     = useState(new Set());
  const channelRef              = useRef(null);

  useEffect(() => {
    loadAll();

    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async ({ new: o }) => {
        const { data } = await supabase
          .from('orders')
          .select('*, profiles(first_name, last_name, email)')
          .eq('id', o.id)
          .single();
        if (data) {
          setActivity(prev => [data, ...prev].slice(0, 10));
          setNewIds(prev => new Set([...prev, data.id]));
          setTimeout(() => setNewIds(prev => { const s = new Set(prev); s.delete(data.id); return s; }), 2500);
          setStats(prev => ({ ...prev, orders: prev.orders + 1, revenue: prev.revenue + Number(o.total) }));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
        setStats(prev => ({ ...prev, users: prev.users + 1 }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadLowStock();
      })
      .subscribe(status => setConnected(status === 'SUBSCRIBED'));

    channelRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, []);

  async function loadAll() {
    const [ordersRes, usersRes, lowStockRes, activityRes] = await Promise.all([
      supabase.from('orders').select('total'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }).lt('stock_quantity', 20),
      supabase.from('orders').select('*, profiles(first_name, last_name, email)').order('created_at', { ascending: false }).limit(10),
    ]);

    const revenue = (ordersRes.data || []).reduce((sum, o) => sum + Number(o.total), 0);
    setStats({
      revenue,
      orders:   ordersRes.data?.length ?? 0,
      users:    usersRes.count ?? 0,
      lowStock: lowStockRes.count ?? 0,
    });
    setActivity(activityRes.data || []);
  }

  async function loadLowStock() {
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .lt('stock_quantity', 20);
    setStats(prev => ({ ...prev, lowStock: count ?? prev.lowStock }));
  }

  return (
    <main>
      <div className="container section">
        <div className="page-title-row">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="text-muted">Welcome back, {user?.firstName}. Here&apos;s what&apos;s happening.</p>
          </div>
          <LiveBadge connected={connected} />
        </div>

        <AdminNav />

        {/* Stats */}
        <div className="stats-row" style={{ marginBottom: 24 }}>
          <StatCard label="Total Revenue"   value={`$${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="var(--accent)" />
          <StatCard label="Total Orders"    value={stats.orders} />
          <StatCard label="Registered Users" value={stats.users} />
          <StatCard label="Low Stock Items"  value={stats.lowStock} color={stats.lowStock > 0 ? 'var(--orange)' : 'var(--green)'} />
        </div>

        {/* Activity + Actions */}
        <div className="dashboard-grid">
          <div className="card">
            <div className="card-header">
              <h3>Recent Orders</h3>
              <span className="text-muted text-sm">Updates in real time</span>
            </div>
            {activity.length === 0 ? (
              <p className="text-muted text-sm" style={{ padding: '16px 0' }}>No orders yet.</p>
            ) : (
              <div className="activity-feed">
                {activity.map(o => (
                  <div key={o.id} className={`activity-item ${newIds.has(o.id) ? 'row-flash' : ''}`}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {o.profiles?.first_name || o.profiles?.email?.split('@')[0] || 'Unknown'} {o.profiles?.last_name || ''}
                      </div>
                      <div className="text-muted text-sm">{o.profiles?.email}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>${Number(o.total).toFixed(2)}</div>
                      <div className="text-muted text-sm">{new Date(o.created_at).toLocaleDateString()}</div>
                    </div>
                    <span className={`badge ${STATUS_COLORS[o.status] || 'badge-gray'}`} style={{ marginLeft: 8 }}>{o.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link to="/admin/products" className="btn btn-primary btn-full">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Manage Products
                </Link>
                <Link to="/admin/users" className="btn btn-outline btn-full">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Manage Users
                </Link>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Realtime Status</h3>
              <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="perk-item">
                  <span className="live-dot live-dot-pulse" style={{ background: connected ? 'var(--green)' : '#94A3B8' }} />
                  <span className="text-muted">Orders channel {connected ? 'connected' : 'connecting…'}</span>
                </div>
                <div className="perk-item">
                  <span className="live-dot live-dot-pulse" style={{ background: connected ? 'var(--green)' : '#94A3B8' }} />
                  <span className="text-muted">Profiles channel {connected ? 'connected' : 'connecting…'}</span>
                </div>
                <div className="perk-item">
                  <span className="live-dot live-dot-pulse" style={{ background: connected ? 'var(--green)' : '#94A3B8' }} />
                  <span className="text-muted">Products channel {connected ? 'connected' : 'connecting…'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
