'use client';

import { useState } from 'react';
import { getAuthToken } from '@/lib/storage';

const apiBase = import.meta.env.VITE_API_URL || '/api';

const steps = ['Address', 'Delivery', 'Payment'];

export default function CheckoutForm() {
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');

  async function handleApplyPromo() {
    if (!promoCode) return;
    setPromoMessage('Validating...');

    try {
      const res = await fetch(`${apiBase}/checkout/validate-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ code: promoCode })
      });

      const body = await res.json();
      if (res.ok) {
        setDiscountAmount(body.discountAmount);
        setPromoMessage(`Discount applied: ₹${body.discountAmount}`);
      } else {
        setDiscountAmount(0);
        setPromoMessage(body.message || 'Invalid coupon');
      }
    } catch {
      setDiscountAmount(0);
      setPromoMessage('Error validating coupon');
    }
  }

  function handleNext() {
    if (step === steps.length - 1) {
      setMessage('Order placed. Complete payment via Razorpay checkout using the backend /api/checkout/create endpoint.');
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Checkout</h1>
      <div className="flex gap-2">
        {steps.map((name, index) => (
          <div key={name} className={`rounded-full px-4 py-2 text-sm font-semibold ${index <= step ? 'bg-foreground hover:bg-black text-white' : 'bg-slate-200 text-slate-700'}`}>
            {index + 1}. {name}
          </div>
        ))}
      </div>
      <section className="rounded-md bg-white p-6 border border-secondary-bg">
        {step === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Address line 1" className="rounded border px-3 py-2" />
            <input placeholder="Address line 2" className="rounded border px-3 py-2" />
            <input placeholder="City" className="rounded border px-3 py-2" />
            <input placeholder="Postal code" className="rounded border px-3 py-2" />
          </div>
        ) : null}
        {step === 1 ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2"><input type="radio" name="delivery" defaultChecked /> Email delivery updates</label>
              <label className="flex items-center gap-2"><input type="radio" name="delivery" /> WhatsApp delivery updates</label>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Have a Promo Code?</h3>
              <div className="flex gap-2">
                <input
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  placeholder="Enter code"
                  className="rounded border px-3 py-2 flex-grow uppercase"
                />
                <button
                  onClick={handleApplyPromo}
                  className="rounded bg-slate-800 text-white px-4 py-2 font-semibold hover:bg-slate-700"
                >
                  Apply
                </button>
              </div>
              {promoMessage && <p className={`mt-2 text-sm ${discountAmount > 0 ? 'text-green-600' : 'text-red-500'}`}>{promoMessage}</p>}
            </div>
          </div>
        ) : null}
        {step === 2 ? <p>Razorpay integration endpoint is ready on backend: <code>/api/checkout/create</code>.</p> : null}
      </section>
      <div className="flex gap-3">
        <button disabled={step === 0} onClick={() => setStep((current) => current - 1)} className="rounded border px-5 py-2 disabled:opacity-50">Back</button>
        <button onClick={handleNext} className="rounded bg-pink-600 px-5 py-2 font-semibold text-white">{step === steps.length - 1 ? 'Place Order' : 'Next'}</button>
      </div>
      {message ? <p className="rounded-md bg-emerald-100 p-3 text-sm text-emerald-900">{message}</p> : null}
    </div>
  );
}
