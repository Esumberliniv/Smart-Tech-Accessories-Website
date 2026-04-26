import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import ProductCard from '../components/ProductCard';

const EarbudsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
  </svg>
);

const WatchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="6" width="14" height="12" rx="2"/>
    <path d="M8 6V4h8v2M8 18v2h8v-2"/>
    <polyline points="12 9 12 12 14 14"/>
  </svg>
);

const AccessoriesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const categories = [
  { name: 'Earbuds',      icon: <EarbudsIcon />,     bg: '#EFF6FF', color: '#2563EB', desc: 'Premium wireless audio',  href: '/shop?cat=Earbuds' },
  { name: 'Smartwatches', icon: <WatchIcon />,        bg: '#ECFDF5', color: '#059669', desc: 'Track your fitness',       href: '/shop?cat=Smartwatches' },
  { name: 'Accessories',  icon: <AccessoriesIcon />,  bg: '#FFF7ED', color: '#EA580C', desc: 'Cables, cases & more',     href: '/shop?cat=Accessories' },
];

const trustItems = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    title: 'Free Shipping',
    desc: 'On orders over $50',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v6h6"/><path d="M3 8a9 9 0 1 0 1.5-5"/>
      </svg>
    ),
    title: '30-Day Returns',
    desc: 'Easy hassle-free returns',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
    title: '2-Year Warranty',
    desc: 'On all products',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: '24/7 Support',
    desc: "We're here to help",
  },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('featured', true)
      .then(({ data }) => setFeatured(data || []));
  }, []);

  return (
    <main>
      {/* Hero */}
      <div className="hero-wrapper">
        <section className="hero">
          <div className="hero-content">
            <p className="hero-eyebrow">New Collection 2026</p>
            <h1>Smart Tech for<br />Modern Life</h1>
            <p className="hero-sub">Discover premium earbuds, smartwatches, and accessories designed to enhance your everyday experience.</p>
            <div className="hero-actions">
              <Link to="/shop" className="btn btn-primary btn-lg">Shop Now</Link>
              <Link to="/about" className="btn btn-outline btn-lg">Learn More</Link>
            </div>
          </div>
          <div className="hero-image">
            <img src="https://images.unsplash.com/photo-1617043786394-f977fa12eddf?auto=format&fit=crop&w=1200&h=1200&q=80" alt="Premium smartwatch on wrist" />
          </div>
        </section>
      </div>

      {/* Trust Strip */}
      <section className="trust-strip">
        <div className="container">
          <div className="trust-grid">
            {trustItems.map(t => (
              <div key={t.title} className="trust-item">
                <span className="trust-icon">{t.icon}</span>
                <div>
                  <div className="trust-title">{t.title}</div>
                  <div className="trust-desc">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Shop by Category</h2>
          <div className="categories-grid">
            {categories.map(c => (
              <Link to={c.href} key={c.name} className="category-card">
                <span className="category-icon" style={{ background: c.bg, color: c.color }}>
                  {c.icon}
                </span>
                <div className="category-name">{c.name}</div>
                <div className="category-desc">{c.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section bg-light">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Products</h2>
            <Link to="/shop" className="btn btn-outline">View All</Link>
          </div>
          <div className="products-grid">
            {featured.length > 0
              ? featured.map(p => <ProductCard key={p.id} product={p} />)
              : [1, 2, 3, 4].map(n => (
                  <div key={n} className="product-card skeleton-card">
                    <div className="product-card-img skeleton" style={{ aspectRatio: '1' }} />
                    <div className="product-card-body">
                      <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 12, width: '45%', marginBottom: 18 }} />
                      <div className="product-card-footer">
                        <div className="skeleton" style={{ height: 18, width: '35%' }} />
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </section>

      {/* Banner */}
      <section className="promo-banner">
        <div className="container">
          <h2>Free Shipping on Orders Over $50</h2>
          <p>Plus 30-day easy returns on all orders</p>
          <Link to="/shop" className="btn btn-white btn-lg">Start Shopping</Link>
        </div>
      </section>
    </main>
  );
}
