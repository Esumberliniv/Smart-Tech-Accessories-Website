import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { fallbackForCategory, preferredImageForProduct } from '../lib/productImages';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct]   = useState(null);
  const [related, setRelated]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [qty, setQty]           = useState(1);
  const [addedMsg, setAddedMsg] = useState('');

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from('products').select('*').eq('id', id).single();
      setProduct(p);
      if (p) {
        const { data: rel } = await supabase
          .from('products')
          .select('*')
          .eq('category', p.category)
          .neq('id', id)
          .limit(4);
        setRelated(rel || []);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="container section"><p>Loading...</p></div>;
  if (!product) return <div className="container section"><p>Product not found.</p></div>;

  const fallback = fallbackForCategory(product.category);
  const imgSrc   = preferredImageForProduct(product) || fallback;

  function handleAddToCart() {
    addItem(product, qty);
    setAddedMsg('Added to cart!');
    setTimeout(() => setAddedMsg(''), 2000);
  }

  return (
    <main>
      <div className="container breadcrumb">
        <Link to="/">Home</Link> › <Link to="/shop">Shop</Link> › <Link to={`/shop?cat=${product.category}`}>{product.category}</Link> › <span>{product.name}</span>
      </div>

      <div className="container section">
        <div className="product-detail-grid">
          {/* Image */}
          <div className="product-images">
            <div className="product-main-img">
              <img
                src={imgSrc}
                alt={product.name}
                onError={e => { if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback; }}
              />
            </div>
          </div>

          {/* Info */}
          <div className="product-info">
            <h1>{product.name}</h1>
            <p className="product-subtitle-lg">{product.category}</p>

            <div className="product-price-lg">
              ${Number(product.price).toFixed(2)}
            </div>

            {product.description && (
              <div className="specs-box">
                <div className="specs-title">About this product</div>
                <p style={{ margin: 0, lineHeight: 1.6 }}>{product.description}</p>
              </div>
            )}

            <div className="stock-row">
              {product.stock_quantity > 0
                ? <><span className="dot dot-green" /><span className="text-green">In Stock — {product.stock_quantity} units available</span></>
                : <><span className="dot dot-red" /><span className="text-red">Out of Stock</span></>
              }
            </div>
            {product.stock_quantity > 0 && <p className="shipping-info">Free shipping on orders over $50.</p>}

            {user ? (
              <>
                <div className="qty-row">
                  <span>Quantity:</span>
                  <div className="qty-control">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                    <span>{qty}</span>
                    <button onClick={() => setQty(q => q + 1)}>+</button>
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-full"
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity === 0}
                >
                  {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                {addedMsg && <p className="success-msg">{addedMsg}</p>}
                <button className="btn btn-outline btn-full">Add to Wishlist</button>
              </>
            ) : (
              <div className="signin-prompt">
                <div>
                  <strong>Sign in to purchase</strong>
                  <p>Create an account or sign in to add items to your cart and access member benefits.</p>
                </div>
                <div className="signin-prompt-actions">
                  <Link to="/login" className="btn btn-primary">Sign In</Link>
                  <Link to="/register" className="btn btn-outline">Create Account</Link>
                </div>
              </div>
            )}

            <Link to="/shop" className="back-link">← Continue Shopping</Link>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="section">
          <div className="container">
            <h2>You Might Also Like</h2>
            <div className="products-grid">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
