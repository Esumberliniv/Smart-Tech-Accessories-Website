import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const STATUS_CLASS = { active: 'badge-green', suspended: 'badge-red', pending: 'badge-gray' };
const STATUS_LABEL = { active: 'Active', suspended: 'Suspended', pending: 'Pending' };
const ROLE_CLASS   = { customer: 'badge-blue', admin: 'badge-purple' };
const ROLE_LABEL   = { customer: 'Customer', admin: 'Admin' };

function userInitials(user) {
  const first = (user?.first_name || '').trim();
  const last = (user?.last_name || '').trim();
  if (first || last) return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
  return (user?.email || 'U')[0].toUpperCase();
}

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

export default function AdminUsers() {
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [roleFilter, setRoleFilter]   = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage]               = useState(1);
  const [onlyMissingNames, setOnlyMissingNames] = useState(false);
  const [newIds, setNewIds]           = useState(new Set());
  const PAGE_SIZE = 5;

  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel('admin-users-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, ({ new: u }) => {
        setUsers(prev => [u, ...prev]);
        setNewIds(prev => new Set([...prev, u.id]));
        setTimeout(() => setNewIds(prev => { const s = new Set(prev); s.delete(u.id); return s; }), 2500);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, ({ new: u }) => {
        setUsers(prev => prev.map(x => x.id === u.id ? u : x));
        setSelectedUser(prev => prev?.id === u.id ? u : prev);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'profiles' }, ({ old }) => {
        setUsers(prev => prev.filter(x => x.id !== old.id));
        setSelectedUser(prev => prev?.id === old.id ? null : prev);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }

  const usersMissingNames = useMemo(
    () => users.filter(u => !(u.first_name || '').trim() || !(u.last_name || '').trim()),
    [users]
  );

  const missingIds = useMemo(() => new Set(usersMissingNames.map(u => u.id)), [usersMissingNames]);

  const filtered = useMemo(() => users.filter(u => {
    if (onlyMissingNames && !missingIds.has(u.id)) return false;
    const name = `${u.first_name || ''} ${u.last_name || ''} ${u.email || ''}`.toLowerCase();
    if (search && !name.includes(search.toLowerCase())) return false;
    if (roleFilter !== 'All Roles'     && u.role   !== roleFilter.toLowerCase())   return false;
    if (statusFilter !== 'All Status'  && u.status !== statusFilter.toLowerCase()) return false;
    return true;
  }), [users, onlyMissingNames, missingIds, search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleStatusChange(id, newStatus) {
    await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this user from profiles? (Auth account remains)')) return;
    await supabase.from('profiles').delete().eq('id', id);
  }

  return (
    <main>
      <div className="container section">
        <div className="page-title-row">
          <div>
            <h1>User Management</h1>
            <p className="text-muted">Manage user roles and account status</p>
          </div>
        </div>

        <AdminNav />

        <div className="users-layout">
          <div className="users-main">
            {/* Data Integrity Panel */}
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ marginBottom: '.25rem' }}>Profile Integrity Check</h3>
                  <p className="text-muted text-sm">
                    {usersMissingNames.length === 0
                      ? 'All profiles include both first and last name.'
                      : `${usersMissingNames.length} profile(s) are missing first or last name.`}
                  </p>
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={onlyMissingNames}
                    onChange={e => { setOnlyMissingNames(e.target.checked); setPage(1); }}
                  />
                  Show only missing-name profiles
                </label>
              </div>
              {usersMissingNames.length > 0 && (
                <div style={{ marginTop: '.75rem', display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                  {usersMissingNames.slice(0, 8).map(u => (
                    <button key={u.id} className="btn btn-outline btn-sm" onClick={() => setSelectedUser(u)} title={u.email || u.id}>
                      {(u.first_name || '—')} {(u.last_name || '—')} &middot; {(u.email || 'no-email')}
                    </button>
                  ))}
                  {usersMissingNames.length > 8 && (
                    <span className="text-muted text-sm" style={{ alignSelf: 'center' }}>+{usersMissingNames.length - 8} more</span>
                  )}
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="admin-filters card">
              <div className="form-group">
                <label>Search</label>
                <div className="search-bar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input placeholder="Search users..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
              </div>
              <div className="form-group">
                <label>Role</label>
                <select className="select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                  {['All Roles', 'Customer', 'Admin'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  {['All Status', 'Active', 'Suspended', 'Pending'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="admin-table-wrap">
              {loading ? (
                <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>Loading users...</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map(u => (
                      <tr
                        key={u.id}
                        className={`${selectedUser?.id === u.id ? 'row-highlighted' : ''} ${newIds.has(u.id) ? 'row-flash' : ''}`}
                        onClick={() => setSelectedUser(u)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <div className="table-product">
                            <span className="avatar-sm avatar-initials" aria-hidden="true">{userInitials(u)}</span>
                            <div>
                              <div className="table-product-name">{u.first_name} {u.last_name}</div>
                              <div className="text-muted text-sm">ID: {u.id.slice(0, 8)}&hellip;</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-muted">{u.email}</td>
                        <td><span className={`badge ${ROLE_CLASS[u.role] || 'badge-gray'}`}>{ROLE_LABEL[u.role] || '—'}</span></td>
                        <td><span className={`badge ${STATUS_CLASS[u.status] || 'badge-gray'}`}>{STATUS_LABEL[u.status] || '—'}</span></td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="table-actions">
                            {u.status !== 'suspended' ? (
                              <button className="icon-btn text-orange" onClick={() => handleStatusChange(u.id, 'suspended')} title="Suspend">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                              </button>
                            ) : (
                              <button className="icon-btn text-green" onClick={() => handleStatusChange(u.id, 'active')} title="Activate">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                              </button>
                            )}
                            <button className="icon-btn text-muted" onClick={() => handleDelete(u.id)} title="Delete">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="table-footer">
                <span className="text-muted text-sm">
                  Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                {totalPages > 1 && (
                  <div className="pagination">
                    <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>&lsaquo;</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                      <button key={n} className={`page-btn ${page === n ? 'page-active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                    ))}
                    <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>&rsaquo;</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="user-detail-panel card">
            {selectedUser ? (
              <>
                <div className="user-detail-header">
                  <span className="avatar-lg avatar-initials" aria-hidden="true" style={{ marginBottom: 8 }}>{userInitials(selectedUser)}</span>
                  <h3>{selectedUser.first_name} {selectedUser.last_name}</h3>
                  <span className={`badge ${STATUS_CLASS[selectedUser.status] || 'badge-gray'}`}>{selectedUser.status}</span>
                </div>
                <div className="user-detail-info">
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Role:</strong> <span className={`badge ${ROLE_CLASS[selectedUser.role]}`}>{selectedUser.role}</span></p>
                  <p><strong>Member since:</strong> {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}</p>
                </div>
                <div className="user-detail-actions">
                  {selectedUser.status !== 'suspended'
                    ? <button className="btn btn-outline btn-full text-orange" onClick={() => handleStatusChange(selectedUser.id, 'suspended')}>Suspend Account</button>
                    : <button className="btn btn-outline btn-full text-green" onClick={() => handleStatusChange(selectedUser.id, 'active')}>Activate Account</button>
                  }
                  <button className="btn btn-danger btn-full" onClick={() => handleDelete(selectedUser.id)}>Remove Profile</button>
                </div>
              </>
            ) : (
              <div className="user-detail-empty">
                <div className="empty-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <p>Select a user to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
