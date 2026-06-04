'use client';

import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '@/store/cart';

export default function Cart() {
  const { items, updateQuantity, removeItem, fetchCart } = useCartStore();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const total = useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [items]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black">Your Cart</h1>
      <div className="space-y-3">
        {items.length === 0 ? <p className="rounded-md bg-white p-6 border border-secondary-bg">Cart is empty.</p> : null}
        {items.map((item) => (
          <article key={item.productId} className="flex items-center justify-between rounded-md bg-white p-4 border border-secondary-bg">
            <div className="flex items-center gap-4">
              {item.image ? (
                <img src={item.image} alt={item.title} className="h-16 w-16 object-cover rounded bg-secondary-bg border border-secondary-bg shrink-0" />
              ) : (
                <div className="h-16 w-16 bg-secondary-bg rounded border border-secondary-bg shrink-0 flex items-center justify-center text-xs text-slate-400">No Img</div>
              )}
              <div>
                <p className="font-bold">{item.title}</p>
                <p className="text-sm text-slate-500">₹{item.unitPrice}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex items-center rounded border border-slate-300">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="px-3 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="px-3 py-1 text-slate-600 hover:bg-slate-100"
                >
                  +
                </button>
              </div>
              <button onClick={() => removeItem(item.productId)} className="text-xs font-semibold text-red-500 hover:text-red-700 underline">Remove</button>
            </div>
          </article>
        ))}
      </div>
      <div className="rounded-md bg-white p-5 border border-secondary-bg">
        <p className="text-lg font-black">Subtotal: ₹{total.toFixed(2)}</p>
        <Link to="/checkout" className="mt-3 inline-block rounded-full bg-foreground hover:bg-black px-5 py-2 font-semibold text-white">Proceed to Checkout</Link>
      </div>
    </div>
  );
}
