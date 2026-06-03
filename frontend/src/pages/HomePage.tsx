import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiGet, Product } from '@/lib/api';

type Category = {
  _id: string;
  name: string;
  description: string;
  image?: string;
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [heroBannerUrl, setHeroBannerUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catsRes, prodsRes, settingsRes] = await Promise.all([
          apiGet<Category[]>('/products/categories'),
          apiGet<{products: Product[]}>('/products?isFeatured=true&limit=4'),
          fetch((import.meta.env.VITE_API_URL || '/api') + '/public/settings').then(res => res.ok ? res.json() : {})
        ]);
        setCategories(catsRes);
        if (prodsRes && prodsRes.products) {
          setFeaturedProducts(prodsRes.products);
        }
        if (settingsRes && settingsRes.heroBannerUrl) {
          setHeroBannerUrl(settingsRes.heroBannerUrl);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-10">
      {heroBannerUrl ? (
        <section className="relative overflow-hidden rounded-3xl shadow-2xl min-h-[400px] flex items-end justify-center pb-12">
          <div className="absolute inset-0 z-0">
            <img src={heroBannerUrl} alt="Hero Banner" className="w-full h-full object-cover" />
          </div>
          <div className="relative z-10 text-center">
            <Link to="/products" className="inline-block rounded-full bg-white px-8 py-4 text-lg font-bold text-brand-dark shadow-lg transition-transform hover:scale-105">Shop Now</Link>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl bg-gradient-to-r from-brand-orange via-brand-pink to-brand-purple p-8 text-white shadow-2xl flex items-center justify-center min-h-[300px]">
          <Link to="/products" className="inline-block rounded-full bg-white px-8 py-4 text-lg font-bold text-brand-dark shadow-lg transition-transform hover:scale-105">Shop Now</Link>
        </section>
      )}

      {featuredProducts.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-black">Featured Products</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <Link key={product._id} to={`/products/${product._id}`} className="group flex flex-col rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-lg">
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100 mb-4">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">No Image</div>
                  )}
                  {product.tags && product.tags.length > 0 && (
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {product.tags.map((tag, idx) => (
                        <span key={idx} className="bg-brand-purple/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-brand-purple line-clamp-1">{product.title}</h3>
                <p className="text-sm text-slate-500 mb-2">{product.artistName}</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-black text-lg">₹{product.price}</span>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-sm text-slate-400 line-through">₹{product.compareAtPrice}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-2xl font-black">Browse by Category</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category._id}
              to={`/products?category=${encodeURIComponent(category.name)}`}
              className="group relative overflow-hidden rounded-2xl p-5 shadow hover:shadow-lg min-h-[120px] flex flex-col justify-end"
            >
              {category.image ? (
                <>
                  <div className="absolute inset-0 z-0">
                    <img src={category.image} alt={category.name} className="w-full h-full object-cover blur-[2px] scale-105 transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40"></div>
                  </div>
                  <div className="relative z-10 text-white">
                    <p className="text-xs font-bold uppercase text-brand-pink drop-shadow-md">{category.description || 'Explore collection'}</p>
                    <p className="mt-1 text-xl font-black drop-shadow-md">{category.name}</p>
                  </div>
                </>
              ) : (
                <div className="bg-white absolute inset-0 z-0 transition-colors group-hover:bg-slate-50">
                  <div className="p-5 h-full flex flex-col justify-end">
                    <p className="text-xs font-bold uppercase text-brand-pink">{category.description || 'Explore collection'}</p>
                    <p className="mt-1 text-xl font-black text-brand-dark">{category.name}</p>
                  </div>
                </div>
              )}
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
