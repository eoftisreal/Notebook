import Link from 'next/link';

const linkClass = 'text-sm font-semibold text-slate-100 hover:text-brand-pink transition';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 bg-brand-dark text-white shadow-lg border-b border-brand-purple/20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-black tracking-wide text-brand-orange">
          Kapda Kraft
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/products" className={linkClass}>Shop</Link>
          <Link href="/admin" className={linkClass}>Sell</Link>
          <Link href="/account" className={linkClass}>Account</Link>
          <Link href="/cart" className={linkClass}>Cart</Link>
        </nav>
      </div>
    </header>
  );
}
