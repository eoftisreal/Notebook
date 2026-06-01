import Link from 'next/link';
import type { Product } from '@/lib/api';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/detail?id=${product._id}`} className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-square bg-slate-100">
        <img
          src={product.images[0] || 'https://placehold.co/600x600?text=Art'}
          alt={product.title}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        {product.compareAtPrice && product.compareAtPrice > product.price ? (
          <span className="absolute left-2 top-2 rounded-full bg-pink-600 px-3 py-1 text-xs font-bold text-white">Sale</span>
        ) : null}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="line-clamp-1 font-bold text-brand-dark">{product.title}</h3>
        <p className="text-sm text-slate-600">By {product.artistName}</p>
        <div className="flex items-center gap-2">
          <span className="font-bold text-brand-dark">₹{product.price}</span>
          {product.compareAtPrice ? <span className="text-xs text-slate-400 line-through">₹{product.compareAtPrice}</span> : null}
        </div>
      </div>
    </Link>
  );
}
