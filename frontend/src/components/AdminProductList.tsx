import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/storage';
import { Trash2 } from 'lucide-react';
import { apiGet, Product } from '@/lib/api';

const apiBase = import.meta.env.VITE_API_URL || '/api';

export default function AdminProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const res = await apiGet<{products: Product[]}>('/products?limit=100');
      if (res && res.products) {
        setProducts(res.products);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`${apiBase}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        fetchProducts(); // Refresh the list
      } else {
        alert('Failed to delete product.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete product.');
    }
  }

  if (loading) {
    return <div className="rounded-xl bg-white p-6 shadow space-y-4"><p>Loading products...</p></div>;
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow space-y-6">
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="font-bold text-xl">Existing Products</h2>
        <button onClick={fetchProducts} className="text-sm text-brand-purple hover:underline">Refresh</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-4 text-center text-slate-500">No products found.</td></tr>
            ) : products.map(product => (
              <tr key={product._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{product.title}</td>
                <td className="px-4 py-3 text-slate-500">{product.category}</td>
                <td className="px-4 py-3 text-slate-500">₹{product.price}</td>
                <td className="px-4 py-3 text-slate-500">{product.stock}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(product._id)} className="text-red-500 hover:text-red-700 p-1" title="Delete Product">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
