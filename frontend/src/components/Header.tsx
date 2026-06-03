import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAuthToken, clearAuth } from '@/lib/storage';
import { parseJwt } from '@/lib/jwt';

const linkClass = 'text-sm font-medium text-secondary-text hover:text-foreground transition-colors tracking-wide';

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
    <>
      <div className="bg-foreground text-white text-[11px] font-medium tracking-widest uppercase py-2 overflow-hidden flex whitespace-nowrap group">
        <div className="animate-marquee group-hover:[animation-play-state:paused] flex min-w-full shrink-0 items-center justify-around gap-8">
          <span>LOOKING FOR SOMETHING NEW? YOU'RE IN THE RIGHT PLACE.</span>
          <span>LOOKING FOR SOMETHING NEW? YOU'RE IN THE RIGHT PLACE.</span>
          <span>LOOKING FOR SOMETHING NEW? YOU'RE IN THE RIGHT PLACE.</span>
          <span>LOOKING FOR SOMETHING NEW? YOU'RE IN THE RIGHT PLACE.</span>
        </div>
      </div>
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8 py-4">
          <nav className="flex items-center gap-4 md:gap-6 flex-1">
            <Link to="/products" className={linkClass}>Shop</Link>
            <Link to="/products?category=Collections" className={`${linkClass} hidden md:inline-block`}>Collections</Link>
            <Link to="/about" className={`${linkClass} hidden md:inline-block`}>About</Link>
            <Link to="/contact" className={`${linkClass} hidden md:inline-block`}>Contact</Link>
          </nav>

          <Link to="/" className="flex justify-center flex-1 shrink-0 min-w-0">
            <img
              src="https://pub-8c7eefa9a8044a569bef9e3d0b743d59.r2.dev/web%20logo.png"
              alt="Kapda Kraft"
              className="h-10 md:h-20 w-auto max-w-full object-contain mix-blend-multiply"
            />
          </Link>

          <nav className="flex items-center justify-end gap-4 md:gap-6 flex-1">
            {isAdmin && (
              <Link to="/admin" className={`${linkClass} hidden sm:inline-block`}>Admin</Link>
            )}

            {isAuthenticated ? (
              <>
                <Link to="/account" className={linkClass}>Account</Link>
                <button onClick={handleLogout} className={`${linkClass} hidden sm:inline-block`}>Logout</button>
              </>
            ) : (
              <Link to="/auth/login" className={linkClass}>Log In</Link>
            )}
            <Link to="/cart" className={linkClass}>Cart</Link>
          </nav>
        </div>
      </header>
    </>
  );
}
