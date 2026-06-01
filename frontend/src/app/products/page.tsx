'use client';

import { useEffect, useState, Suspense } from 'react';
import { apiGet, Product } from '@/lib/api';
import ProductGrid from '@/components/ProductGrid';
import { useSearchParams } from 'next/navigation';

type ProductResponse = {
  products: Product[];
  page: number;
  totalPages: number;
};

function ProductListingContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q');
  const category = searchParams.get('category');
  const pageParam = searchParams.get('page');

  const [data, setData] = useState<ProductResponse>({ products: [], page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchProducts() {
      const query = new URLSearchParams();
      if (q) query.set('q', q);
      if (category) query.set('category', category);
      if (pageParam) query.set('page', pageParam);

      try {
        const res = await apiGet<ProductResponse>(`/products?${query.toString()}`);
        if (active) setData(res);
      } catch {
        if (active) setData({ products: [], page: 1, totalPages: 1 });
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchProducts();

    return () => {
      active = false;
    };
  }, [q, category, pageParam]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Explore Products</h1>
      <form className="grid gap-3 rounded-2xl bg-white p-4 shadow sm:grid-cols-3">
        <input name="q" defaultValue={q || ''} placeholder="Search artwork" className="rounded-lg border px-3 py-2" />
        <input name="category" defaultValue={category || ''} placeholder="Category" className="rounded-lg border px-3 py-2" />
        <button className="rounded-lg bg-brand-purple hover:bg-brand-pink px-4 py-2 font-semibold text-white">Apply Filters</button>
      </form>
      {loading ? (
        <p>Loading products...</p>
      ) : (
        <>
          <ProductGrid products={data.products} />
          <p className="text-sm text-slate-500">Page {data.page} of {data.totalPages}</p>
        </>
      )}
    </div>
  );
}

export default function ProductListing() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ProductListingContent />
    </Suspense>
  );
}
