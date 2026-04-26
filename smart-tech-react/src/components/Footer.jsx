import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-col">
          <div className="footer-brand">
            <span className="brand-mark" style={{ background: '#2563EB' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4.5 13.5H11L10.5 22 20 10h-6.5z"/></svg>
            </span>
            SmartTech
          </div>
          <p className="footer-tagline">Premium smart technology products for modern life.</p>
        </div>
        <div className="footer-col">
          <h4>Shop</h4>
          <Link to="/shop">Earbuds</Link>
          <Link to="/shop">Smartwatches</Link>
          <Link to="/shop">Accessories</Link>
        </div>
        <div className="footer-col">
          <h4>Support</h4>
          <Link to="/contact">Help Center</Link>
          <Link to="/contact">Returns</Link>
          <Link to="/contact">Warranty</Link>
        </div>
        <div className="footer-col">
          <h4>Connect</h4>
          <div className="social-links">
            <a href="#" aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" aria-label="Twitter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 SmartTech. All rights reserved.</p>
      </div>
    </footer>
  );
}
