import { Link } from 'react-router-dom';
import { fallbackForCategory, preferredImageForProduct } from '../lib/productImages';

export default function ProductCard({ product }) {
  const fallback = fallbackForCategory(product.category);
  const imgSrc = preferredImageForProduct(product) || fallback;

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="product-card-img">
        <img
          src={imgSrc}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            if (e.currentTarget.src === fallback) return;
            e.currentTarget.src = fallback;
          }}
        />
      </Link>
      <div className="product-card-body">
        <div className="product-card-name">{product.name}</div>
        <div className="product-card-subtitle">{product.category}</div>
        <div className="product-card-footer">
          <div className="product-card-price">
            <span className="price">${Number(product.price).toFixed(2)}</span>
          </div>
          <Link to={`/product/${product.id}`} className="btn btn-primary btn-sm">View</Link>
        </div>
      </div>
    </div>
  );
}
