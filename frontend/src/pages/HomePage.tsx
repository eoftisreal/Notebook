import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

type Category = {
  _id: string;
  name: string;
  description: string;
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await apiGet<Category[]>('/products/categories');
        setCategories(res);
      } catch (e) {
        console.error(e);
      }
    }
    fetchCategories();
  }, []);

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-r from-brand-orange via-brand-pink to-brand-purple p-8 text-white shadow-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest">Deals From Space</p>
        <h1 className="text-4xl font-black">Find bold art for everything you wear and carry.</h1>
        <p className="mt-3 max-w-xl text-white/90">A playful marketplace where independent artists ship creativity straight to your cart.</p>
        <Link to="/products" className="mt-6 inline-block rounded-full bg-white px-6 py-3 font-bold text-brand-dark">Shop Now</Link>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-black">Browse by Category</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link key={category._id} to={`/products?category=${encodeURIComponent(category.name)}`} className="rounded-2xl bg-white p-5 shadow hover:shadow-lg">
              <p className="text-xs font-bold uppercase text-brand-pink">{category.description || 'Explore collection'}</p>
              <p className="mt-2 text-xl font-black text-brand-dark">{category.name}</p>
            </Link>
          ))}
          {categories.length === 0 && (
            <p className="col-span-full text-slate-500">No categories found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
