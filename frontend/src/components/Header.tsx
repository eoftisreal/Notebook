import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAuthToken, clearAuth } from '@/lib/storage';
import { parseJwt } from '@/lib/jwt';

const linkClass = 'text-sm font-semibold text-slate-100 hover:text-brand-pink transition';

export default function Header() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = getAuthToken();
      if (token) {
        setIsAuthenticated(true);
        const payload = parseJwt(token);
        if (payload && (payload.role === 'admin' || payload.role === 'master_admin' || payload.isAdmin)) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    };

    checkAuth();

    window.addEventListener('auth-change', checkAuth);
    return () => {
      window.removeEventListener('auth-change', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    setIsAuthenticated(false);
    setIsAdmin(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-10 bg-brand-dark text-white shadow-lg border-b border-brand-purple/20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center">
          <img
            src="https://pub-8c7eefa9a8044a569bef9e3d0b743d59.r2.dev/kapda%20kraft%20(1).gif"
            alt="Kapda Kraft"
            className="h-12 object-contain"
          />
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/products" className={linkClass}>Shop</Link>
          <Link to="/cart" className={linkClass}>Cart</Link>

          {isAdmin && (
            <Link to="/admin" className={linkClass}>Admin</Link>
          )}

          {isAuthenticated ? (
            <>
              <Link to="/account" className={linkClass}>Account</Link>
              <button onClick={handleLogout} className={linkClass}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/auth/login" className={linkClass}>Log In</Link>
              <Link to="/auth/signup" className={linkClass}>Sign Up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
