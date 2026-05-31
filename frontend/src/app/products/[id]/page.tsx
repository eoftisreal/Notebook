import Link from 'next/link';
import { apiGet, Product } from '@/lib/api';

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let product: Product | null = null;
  try {
    product = await apiGet<Product>(`/products/${id}`);
  } catch {
    product = null;
  }

  if (!product) {
    return <p className="rounded-xl bg-white p-6 shadow">Product not found.</p>;
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <img src={product.images[0] || 'https://placehold.co/700x700?text=Art'} alt={product.title} className="aspect-square w-full rounded-2xl object-cover" />
        <div className="grid grid-cols-3 gap-2">
          {(product.images.length ? product.images : [product.images[0]]).map((image, index) => (
            <img key={`${image}-${index}`} src={image || 'https://placehold.co/300x300?text=Preview'} alt={`${product.title} preview ${index + 1}`} className="aspect-square rounded-lg object-cover" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <h1 className="text-3xl font-black">{product.title}</h1>
        <p className="text-slate-600">By {product.artistName}</p>
        <p className="text-2xl font-bold">₹{product.price}</p>
        <p>{product.description}</p>
        <p className="text-sm text-slate-500">Stock: {product.stock}</p>
        <Link href="/cart" className="inline-block rounded-full bg-pink-600 px-6 py-3 font-semibold text-white">Add to Cart</Link>
      </div>
    </div>
  );
}
