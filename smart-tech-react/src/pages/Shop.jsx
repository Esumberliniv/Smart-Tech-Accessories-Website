import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import ProductCard from '../components/ProductCard';

const CATEGORIES = ['All Products', 'Earbuds', 'Smartwatches', 'Accessories'];
const SORT_OPTIONS = ['Default', 'Price: Low to High', 'Price: High to Low'];
const PAGE_SIZE = 8;

export default function Shop() {
  const [searchParams] = useSearchParams();
  const initCat = searchParams.get('cat') || 'All Products';

  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState(initCat);
  const [sort, setSort]         = useState('Default');
  const [page, setPage]         = useState(1);

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .then(({ data }) => {
        setAllProducts(data || []);
        setLoadingProducts(false);
      });
  }, []);

  const { filtered, totalPages, paged } = useMemo(() => {
    let list = [...allProducts];
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase()));
    if (category !== 'All Products') list = list.filter(p => p.category === category);
    if (sort === 'Price: Low to High')  list.sort((a, b) => a.price - b.price);
    if (sort === 'Price: High to Low')  list.sort((a, b) => b.price - a.price);
    const pages = Math.ceil(list.length / PAGE_SIZE);
    return { filtered: list, totalPages: pages, paged: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) };
  }, [allProducts, search, category, sort, page]);

  function handleCategory(cat) {
    setCategory(cat);
    setPage(1);
  }

  return (
    <main>
      <div className="page-header">
        <div className="container">
          <h1>Shop Smart Tech</h1>
          <p>Browse our complete collection of premium earbuds, smartwatches, and accessories</p>
        </div>
      </div>

      <div className="container section">
        {/* Search & Sort Bar */}
        <div className="shop-toolbar">
          <div className="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select value={category} onChange={e => handleCategory(e.target.value)} className="select">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} className="select">
            {SORT_OPTIONS.map(s => <option key={s} value={s}>Sort By: {s}</option>)}
          </select>
        </div>

        {/* Category Pills */}
        <div className="category-pills">
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`pill ${category === c ? 'pill-active' : ''}`}
              onClick={() => handleCategory(c)}
            >{c}</button>
          ))}
        </div>

        <div className="shop-meta">
          <span>Showing <strong>{filtered.length}</strong> products</span>
        </div>

        {loadingProducts ? (
          <div className="products-grid">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="product-card" style={{ height: 320, background: '#f3f4f6', borderRadius: 12 }} />
            ))}
          </div>
        ) : paged.length > 0 ? (
          <div className="products-grid">
            {paged.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="empty-state">
            <p>No products found. Try a different search or category.</p>
          </div>
        )}

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
    </main>
  );
}
