import Link from 'next/link';

const linkClass = 'text-sm font-semibold text-slate-100 hover:text-cyan-300 transition';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 bg-slate-950 text-white shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-black tracking-wide text-cyan-300">
          IndieMart
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
