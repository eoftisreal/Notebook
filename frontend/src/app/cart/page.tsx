'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type CartItem = {
  productId: string;
  title: string;
  unitPrice: number;
  quantity: number;
};

const CART_KEY = 'indiemart_cart';

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const total = useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [items]);

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((current) => current.map((item) => (item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item)));
  };

  const remove = (productId: string) => setItems((current) => current.filter((item) => item.productId !== productId));

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black">Your Cart</h1>
      <div className="space-y-3">
        {items.length === 0 ? <p className="rounded-xl bg-white p-6 shadow">Cart is empty.</p> : null}
        {items.map((item) => (
          <article key={item.productId} className="flex items-center justify-between rounded-xl bg-white p-4 shadow">
            <div>
              <p className="font-bold">{item.title}</p>
              <p className="text-sm text-slate-500">₹{item.unitPrice}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(event) => updateQuantity(item.productId, Number(event.target.value))}
                className="w-16 rounded border px-2 py-1"
              />
              <button onClick={() => remove(item.productId)} className="rounded border px-3 py-1 text-sm">Remove</button>
            </div>
          </article>
        ))}
      </div>
      <div className="rounded-xl bg-white p-5 shadow">
        <p className="text-lg font-black">Subtotal: ₹{total.toFixed(2)}</p>
        <Link href="/checkout" className="mt-3 inline-block rounded-full bg-slate-900 px-5 py-2 font-semibold text-white">Proceed to Checkout</Link>
      </div>
    </div>
  );
}
