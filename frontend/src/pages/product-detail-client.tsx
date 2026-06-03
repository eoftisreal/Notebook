'use client';

import { useEffect, useState } from 'react';
import { apiGet, Product } from '@/lib/api';
import AddToCartButton from '@/components/AddToCartButton';

export default function ProductDetailClient({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchProduct() {
      try {
        const data = await apiGet<Product>(`/products/${id}`);
        if (active) setProduct(data);
      } catch {
        if (active) setProduct(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchProduct();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <p className="rounded-xl bg-white p-6 shadow">Loading product...</p>;
  }

  if (!product) {
    return <p className="rounded-xl bg-white p-6 shadow">Product not found.</p>;
  }

  const gallery = product.images.length > 0 ? product.images : ['https://placehold.co/300x300?text=Preview'];

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <img src={product.images[0] || 'https://placehold.co/700x700?text=Art'} alt={product.title} className="aspect-square w-full rounded-2xl object-cover" />
        <div className="grid grid-cols-3 gap-2">
          {gallery.map((image, index) => (
            <img key={`${image}-${index}`} src={image || 'https://placehold.co/300x300?text=Preview'} alt={`${product.title} preview ${index + 1}`} className="aspect-square rounded-lg object-cover" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <h1 className="text-3xl font-black">{product.title}</h1>
        <p className="text-slate-600">By {product.artistName}</p>

        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {product.tags.map((tag: string, idx: number) => (
              <span key={idx} className="bg-brand-purple text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                {tag}
              </span>
            ))}
          </div>
        )}
        <p className="text-2xl font-bold">₹{product.price}</p>
        <p>{product.description}</p>
        <p className="text-sm text-slate-500">Stock: {product.stock}</p>
        <AddToCartButton productId={product._id} title={product.title} price={product.price} />
      </div>
    </div>
  );
}
