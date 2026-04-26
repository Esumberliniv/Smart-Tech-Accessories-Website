import { Link } from 'react-router-dom';

export default function About() {
  return (
    <main>
      <div className="page-header">
        <div className="container">
          <h1>About SmartTech</h1>
          <p>Premium smart technology products for modern life</p>
        </div>
      </div>
      <div className="container section">
        <div className="about-grid">
          <div>
            <h2>Our Mission</h2>
            <p>At SmartTech, we believe technology should seamlessly enhance your everyday life. We curate and design premium smart accessories that combine cutting-edge innovation with intuitive usability.</p>
            <p>Founded in 2020, we've grown to become a trusted destination for tech enthusiasts who demand both performance and style.</p>
            <Link to="/shop" className="btn btn-primary mt-2">Browse Our Products</Link>
          </div>
          <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop" alt="Team" className="about-img" />
        </div>

        <div className="stats-row">
          {[['50K+', 'Happy Customers'], ['200+', 'Products'], ['4.8★', 'Average Rating'], ['24/7', 'Support']].map(([num, label]) => (
            <div key={label} className="stat-card">
              <div className="stat-num">{num}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
