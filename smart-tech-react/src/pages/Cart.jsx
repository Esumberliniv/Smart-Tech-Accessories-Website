import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import ProductCard from '../components/ProductCard';

const PROMO_CODES = { 'SMART10': 0.10, 'SAVE20': 0.20 };

export default function Cart() {
  const { items, removeItem, updateQty, subtotal, tax, shipping, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [promo, setPromo]               = useState('');
  const [discount, setDiscount]         = useState(0);
  const [promoMsg, setPromoMsg]         = useState('');
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [suggestions, setSuggestions]   = useState([]);

  useEffect(() => {
    supabase.from('products').select('*').eq('featured', true).limit(4)
      .then(({ data }) => setSuggestions(data || []));
  }, []);

  function applyPromo() {
    const code = promo.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      setDiscount(PROMO_CODES[code]);
      setPromoMsg(`Promo applied! ${PROMO_CODES[code] * 100}% off`);
    } else {
      setDiscount(0);
      setPromoMsg('Invalid promo code');
    }
  }

  async function handleCheckout() {
    if (!user) { navigate('/login'); return; }
    const finalTotal = total - subtotal * discount;
    await supabase.from('orders').insert({ user_id: user.id, total: finalTotal, status: 'Processing' });
    clearCart();
    setCheckoutDone(true);
  }

  if (checkoutDone) {
    return (
      <main className="container section text-center">
        <div className="checkout-success">
          <div className="success-icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" stroke="#10B981" strokeWidth="1.5"/>
              <polyline points="9 12 11 14 15 10" stroke="#10B981" strokeWidth="2"/>
            </svg>
          </div>
          <h2>Order Placed Successfully!</h2>
          <p>Thank you for your purchase. Check your order history in your profile.</p>
          <Link to="/shop" className="btn btn-primary btn-lg">Continue Shopping</Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="container section">
        <div className="cart-page-header">
          <h1>Shopping Cart</h1>
          <p className="text-muted">{items.length} {items.length === 1 ? 'item' : 'items'} in your cart</p>
        </div>

        {items.length === 0 ? (
          <div className="empty-cart cart-empty-state">
            <div className="empty-cart-icon">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
            <h3>Your cart is empty</h3>
            <p>Looks like you haven&apos;t added anything yet.</p>
            <Link to="/shop" className="btn btn-primary btn-lg">Start Shopping</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {items.map(item => {
                const imgSrc = item.image_url || item.image || '';
                return (
                  <div key={item.id} className="cart-item">
                    <img src={imgSrc} alt={item.name} className="cart-item-img" />
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-sub">{item.category}</div>
                      <div className="cart-item-actions">
                        <div className="qty-control">
                          <button onClick={() => updateQty(item.id, item.qty - 1)}>&minus;</button>
                          <span>{item.qty}</span>
                          <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                        </div>
                      </div>
                    </div>
                    <div className="cart-item-price">${(item.price * item.qty).toFixed(2)}</div>
                    <button className="icon-btn" onClick={() => removeItem(item.id)} aria-label="Remove">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                );
              })}

              <div className="promo-row">
                <input className="input" placeholder="Enter promo code" value={promo} onChange={e => setPromo(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyPromo()} />
                <button className="btn btn-outline" onClick={applyPromo}>Apply</button>
              </div>
              {promoMsg && <p className={discount > 0 ? 'success-msg' : 'error-msg'}>{promoMsg}</p>}
            </div>

            <div className="order-summary">
              <h3>Order Summary</h3>
              <div className="summary-row"><span>Subtotal ({items.length} items)</span><span>${subtotal.toFixed(2)}</span></div>
              {discount > 0 && <div className="summary-row text-green"><span>Discount ({discount * 100}%)</span><span>&minus;${(subtotal * discount).toFixed(2)}</span></div>}
              <div className="summary-row"><span>Shipping</span><span className={shipping === 0 ? 'text-green' : ''}>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span></div>
              <div className="summary-row"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
              <div className="summary-divider" />
              <div className="summary-row summary-total">
                <span>Total</span>
                <span>${(total - subtotal * discount).toFixed(2)}</span>
              </div>
              <button className="btn btn-primary btn-full" onClick={handleCheckout}>Proceed to Checkout</button>
              <Link to="/shop" className="btn btn-ghost btn-full">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Continue Shopping
              </Link>
              <div className="summary-perks">
                <div className="perk-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                  Free shipping on orders over $50
                </div>
                <div className="perk-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  30-day return policy
                </div>
                <div className="perk-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Secure checkout
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <section className="section bg-light">
          <div className="container">
            <h2>You might also like</h2>
            <div className="products-grid">
              {suggestions.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
