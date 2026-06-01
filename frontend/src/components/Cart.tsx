'use client';

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CART_KEY, CartItem } from '@/lib/storage';
import { useLocalStorageState } from '@/lib/hooks';

export default function Cart() {
  const [items, setItems] = useLocalStorageState<CartItem[]>(CART_KEY, []);

  const total = useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [items]);

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((current) => current.map((item) => (item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item)));
  };

  const remove = (productId: string) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  };

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
        <Link to="/checkout" className="mt-3 inline-block rounded-full bg-brand-purple hover:bg-brand-pink px-5 py-2 font-semibold text-white">Proceed to Checkout</Link>
      </div>
    </div>
  );
}
