import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { fallbackForCategory } from '../lib/productImages';

const STATUS_CLASS  = { active: 'badge-green', 'low-stock': 'badge-yellow', 'out-of-stock': 'badge-red' };
const STATUS_LABEL  = { active: 'Active', 'low-stock': 'Low Stock', 'out-of-stock': 'Out of Stock' };

function stockStatus(qty) {
  if (qty === 0) return 'out-of-stock';
  if (qty < 20)  return 'low-stock';
  return 'active';
}

const EMPTY_FORM = { name: '', description: '', category: 'Earbuds', price: '', stock_quantity: '', image_url: '', featured: false };

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

export default function AdminProducts() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('All Categories');
  const [selected, setSelected]   = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('admin-products-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, ({ new: p }) => {
        setProducts(prev => [p, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, ({ new: p }) => {
        setProducts(prev => prev.map(x => x.id === p.id ? p : x));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'products' }, ({ old }) => {
        setProducts(prev => prev.filter(x => x.id !== old.id));
        setSelected(prev => prev.filter(i => i !== old.id));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== 'All Categories' && p.category !== category) return false;
    return true;
  }), [products, search, category]);

  function toggleSelect(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }
  function toggleAll() {
    setSelected(selected.length === filtered.length ? [] : filtered.map(p => p.id));
  }

  function openAdd() {
    setEditProduct(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  }

  function openEdit(p) {
    setEditProduct(p);
    setForm({
      name: p.name,
      description: p.description || '',
      category: p.category || 'Earbuds',
      price: p.price,
      stock_quantity: p.stock_quantity,
      image_url: p.image_url || '',
      featured: p.featured || false,
    });
    setError('');
    setShowModal(true);
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      stock_quantity: Number(form.stock_quantity),
      image_url: form.image_url,
      featured: form.featured,
    };

    const result = editProduct
      ? await supabase.from('products').update(payload).eq('id', editProduct.id)
      : await supabase.from('products').insert(payload);

    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    setShowModal(false);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
  }

  async function bulkDelete() {
    if (!window.confirm(`Delete ${selected.length} products?`)) return;
    await supabase.from('products').delete().in('id', selected);
    setSelected([]);
  }

  return (
    <main>
      <div className="container section">
        <div className="page-title-row">
          <div>
            <h1>Product Management</h1>
            <p className="text-muted">Manage your product inventory</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Product
          </button>
        </div>

        <AdminNav />

        {/* Filters */}
        <div className="admin-filters card">
          <div className="form-group">
            <label>Search</label>
            <div className="search-bar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Category</label>
            <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
              {['All Categories', 'Earbuds', 'Smartwatches', 'Accessories'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="bulk-bar">
          <label className="checkbox-label">
            <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} />
            Select All <span className="text-muted">{selected.length} selected</span>
          </label>
          <button className="btn btn-danger btn-sm" disabled={selected.length === 0} onClick={bulkDelete}>Delete Selected</button>
        </div>

        {/* Table */}
        <div className="admin-table-wrap">
          {loading ? (
            <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>Loading products...</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const status = stockStatus(p.stock_quantity);
                  return (
                    <tr key={p.id} className={selected.includes(p.id) ? 'row-selected' : ''}>
                      <td><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                      <td>
                        <div className="table-product">
                          <img src={p.image_url || fallbackForCategory(p.category)} alt={p.name} className="table-img" />
                          <div>
                            <div className="table-product-name">{p.name}</div>
                            <div className="text-muted text-sm">{p.description?.slice(0, 50)}&hellip;</div>
                          </div>
                        </div>
                      </td>
                      <td>{p.category}</td>
                      <td><strong>${Number(p.price).toFixed(2)}</strong></td>
                      <td className={p.stock_quantity === 0 ? 'text-red' : p.stock_quantity < 20 ? 'text-orange' : ''}>
                        {p.stock_quantity} units
                      </td>
                      <td><span className={`badge ${STATUS_CLASS[status] || 'badge-gray'}`}>{STATUS_LABEL[status]}</span></td>
                      <td>
                        <div className="table-actions">
                          <button className="icon-btn text-accent" onClick={() => openEdit(p)} aria-label="Edit">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className="icon-btn text-muted" onClick={() => handleDelete(p.id)} aria-label="Delete">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div className="table-footer text-muted text-sm">
            Showing {filtered.length} of {products.length} products
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label>Product Name *</label>
                <input name="name" value={form.name} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" className="textarea" rows={3} value={form.description} onChange={handleFormChange} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" className="select" value={form.category} onChange={handleFormChange}>
                    {['Earbuds', 'Smartwatches', 'Accessories'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Price ($) *</label>
                  <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleFormChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input name="stock_quantity" type="number" min="0" value={form.stock_quantity} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Image URL</label>
                  <input name="image_url" type="url" value={form.image_url} onChange={handleFormChange} placeholder="https://..." />
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input name="featured" type="checkbox" checked={form.featured} onChange={handleFormChange} />
                  Featured on homepage
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editProduct ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
