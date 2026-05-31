import ProductCard from '@/components/ProductCard';
import { apiGet, Product } from '@/lib/api';

type ProductResponse = {
  products: Product[];
  page: number;
  totalPages: number;
};

export default async function ProductListing({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.category) query.set('category', params.category);
  if (params.page) query.set('page', params.page);

  let data: ProductResponse = { products: [], page: 1, totalPages: 1 };

  try {
    data = await apiGet<ProductResponse>(`/products?${query.toString()}`);
  } catch {
    data = { products: [], page: 1, totalPages: 1 };
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Explore Products</h1>
      <form className="grid gap-3 rounded-2xl bg-white p-4 shadow sm:grid-cols-3">
        <input name="q" defaultValue={params.q || ''} placeholder="Search artwork" className="rounded-lg border px-3 py-2" />
        <input name="category" defaultValue={params.category || ''} placeholder="Category" className="rounded-lg border px-3 py-2" />
        <button className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">Apply Filters</button>
      </form>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
      <p className="text-sm text-slate-500">Page {data.page} of {data.totalPages}</p>
    </div>
  );
}
