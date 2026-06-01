import { Link } from 'react-router-dom';

const linkClass = 'text-sm font-semibold text-slate-100 hover:text-brand-pink transition';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 bg-brand-dark text-white shadow-lg border-b border-brand-purple/20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-black tracking-wide text-brand-orange">
          Kapda Kraft
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/products" className={linkClass}>Shop</Link>
          <Link to="/admin" className={linkClass}>Sell</Link>
          <Link to="/account" className={linkClass}>Account</Link>
          <Link to="/cart" className={linkClass}>Cart</Link>
        </nav>
      </div>
    </header>
  );
}
