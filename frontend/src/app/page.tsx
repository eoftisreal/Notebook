import Link from 'next/link';

const categories = [
  { name: 'T-Shirts', discount: 'Up to 30% off' },
  { name: 'Phone Cases', discount: 'Buy 2 Get 1' },
  { name: 'Stickers', discount: 'Fresh drops daily' },
  { name: 'Wall Art', discount: 'Limited editions' },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-r from-brand-orange via-brand-pink to-brand-purple p-8 text-white shadow-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest">Deals From Space</p>
        <h1 className="text-4xl font-black">Find bold art for everything you wear and carry.</h1>
        <p className="mt-3 max-w-xl text-white/90">A playful marketplace where independent artists ship creativity straight to your cart.</p>
        <Link href="/products" className="mt-6 inline-block rounded-full bg-white px-6 py-3 font-bold text-brand-dark">Shop Now</Link>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-black">Browse by Category</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.name} href={`/products?category=${encodeURIComponent(category.name)}`} className="rounded-2xl bg-white p-5 shadow hover:shadow-lg">
              <p className="text-xs font-bold uppercase text-brand-pink">{category.discount}</p>
              <p className="mt-2 text-xl font-black text-brand-dark">{category.name}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
