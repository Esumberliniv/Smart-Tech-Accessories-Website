import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import AdminProducts from './pages/AdminProducts';
import AdminUsers from './pages/AdminUsers';
import About from './pages/About';
import Contact from './pages/Contact';

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<AppLayout><Home /></AppLayout>} />
            <Route path="/shop" element={<AppLayout><Shop /></AppLayout>} />
            <Route path="/product/:id" element={<AppLayout><ProductDetail /></AppLayout>} />
            <Route path="/cart" element={<AppLayout><Cart /></AppLayout>} />
            <Route path="/about" element={<AppLayout><About /></AppLayout>} />
            <Route path="/contact" element={<AppLayout><Contact /></AppLayout>} />
            <Route path="/profile" element={<AppLayout><ProtectedRoute><Profile /></ProtectedRoute></AppLayout>} />
            <Route path="/admin" element={<AppLayout><ProtectedRoute adminOnly><AdminProducts /></ProtectedRoute></AppLayout>} />
            <Route path="/admin/users" element={<AppLayout><ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute></AppLayout>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
