import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function userInitials(user) {
  const first = (user?.firstName || '').trim();
  const last = (user?.lastName || '').trim();
  if (first || last) return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
  return (user?.email || 'U')[0].toUpperCase();
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-mark">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4.5 13.5H11L10.5 22 20 10h-6.5z"/></svg>
          </span>
          SmartTech
        </Link>
        <div className="navbar-links">
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div className="navbar-actions">
          <button className="icon-btn" aria-label="Search" onClick={() => navigate('/shop')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          <Link to="/cart" className="icon-btn cart-btn" aria-label="Cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            {count > 0 && <span className="cart-badge">{count}</span>}
          </Link>
          {user ? (
            <div className="user-menu">
              <span className="avatar-sm avatar-initials" aria-hidden="true">{userInitials(user)}</span>
              <span className="user-name">{user.firstName}</span>
              <div className="dropdown">
                <Link to="/profile">Profile</Link>
                {user.role === 'admin' && <Link to="/admin">Admin</Link>}
                <button onClick={handleLogout}>Sign Out</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
