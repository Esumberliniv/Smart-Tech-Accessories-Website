import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
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

export default function AdminUsers() {
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [roleFilter, setRoleFilter]   = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage]               = useState(1);
  const [onlyMissingNames, setOnlyMissingNames] = useState(false);
  const PAGE_SIZE = 5;

  useEffect(() => { fetchUsers(); }, []);

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
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
    if (selectedUser?.id === id) setSelectedUser(prev => ({ ...prev, status: newStatus }));
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this user from profiles? (Auth account remains)')) return;
    await supabase.from('profiles').delete().eq('id', id);
    setUsers(prev => prev.filter(u => u.id !== id));
    if (selectedUser?.id === id) setSelectedUser(null);
  }

  return (
    <main>
      <div className="container section">
        <div className="page-title-row">
          <div>
            <h1>User Management</h1>
            <p className="text-muted">Manage user roles and account status — live data from Supabase</p>
          </div>
          <div className="admin-header-actions">
            <Link to="/admin" className="btn btn-outline">Product Management</Link>
          </div>
        </div>

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
                    onChange={e => {
                      setOnlyMissingNames(e.target.checked);
                      setPage(1);
                    }}
                  />
                  Show only missing-name profiles
                </label>
              </div>
              {usersMissingNames.length > 0 && (
                <div style={{ marginTop: '.75rem', display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                  {usersMissingNames.slice(0, 8).map(u => (
                    <button
                      key={u.id}
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelectedUser(u)}
                      title={u.email || u.id}
                    >
                      {(u.first_name || '—')} {(u.last_name || '—')} · {(u.email || 'no-email')}
                    </button>
                  ))}
                  {usersMissingNames.length > 8 && (
                    <span className="text-muted text-sm" style={{ alignSelf: 'center' }}>
                      +{usersMissingNames.length - 8} more
                    </span>
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
                        className={selectedUser?.id === u.id ? 'row-highlighted' : ''}
                        onClick={() => setSelectedUser(u)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <div className="table-product">
                            <span className="avatar-sm avatar-initials" aria-hidden="true">{userInitials(u)}</span>
                            <div>
                              <div className="table-product-name">{u.first_name} {u.last_name}</div>
                              <div className="text-muted text-sm">ID: {u.id.slice(0, 8)}…</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-muted">{u.email}</td>
                        <td><span className={`badge ${ROLE_CLASS[u.role] || 'badge-gray'}`}>{ROLE_LABEL[u.role] || '—'}</span></td>
                        <td><span className={`badge ${STATUS_CLASS[u.status] || 'badge-gray'}`}>{STATUS_LABEL[u.status] || '—'}</span></td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="table-actions">
                            {u.status !== 'suspended'
                              ? <button className="icon-btn text-orange" onClick={() => handleStatusChange(u.id, 'suspended')} title="Suspend">🚫</button>
                              : <button className="icon-btn text-green" onClick={() => handleStatusChange(u.id, 'active')} title="Activate">✅</button>
                            }
                            <button className="icon-btn text-muted" onClick={() => handleDelete(u.id)} title="Delete">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="table-footer">
                <span className="text-muted text-sm">Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                {totalPages > 1 && (
                  <div className="pagination">
                    <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                      <button key={n} className={`page-btn ${page === n ? 'page-active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                    ))}
                    <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
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
                  <span className="avatar-lg avatar-initials" aria-hidden="true">{userInitials(selectedUser)}</span>
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
                <div className="empty-icon">👤</div>
                <p>Select a user to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
