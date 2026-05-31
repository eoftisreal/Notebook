'use client';

import Link from 'next/link';

type Props = {
  productId: string;
  title: string;
  price: number;
};

export default function AddToCartButton({ productId, title, price }: Props) {
  return (
    <Link
      href="/cart"
      onClick={() => {
        const key = 'indiemart_cart';
        let cart = [];
        try {
          const raw = localStorage.getItem(key);
          cart = raw ? JSON.parse(raw) : [];
        } catch {
          cart = [];
        }
        const existing = cart.find((item: { productId: string }) => item.productId === productId);
        if (existing) {
          existing.quantity += 1;
        } else {
          cart.push({ productId, title, unitPrice: price, quantity: 1 });
        }
        localStorage.setItem(key, JSON.stringify(cart));
      }}
      className="inline-block rounded-full bg-pink-600 px-6 py-3 font-semibold text-white"
    >
      Add to Cart
    </Link>
  );
}
