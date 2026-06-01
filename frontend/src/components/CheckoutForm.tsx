'use client';

import { useState } from 'react';

const steps = ['Address', 'Delivery', 'Payment'];

export default function CheckoutForm() {
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('');

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
          <div key={name} className={`rounded-full px-4 py-2 text-sm font-semibold ${index <= step ? 'bg-brand-purple hover:bg-brand-pink text-white' : 'bg-slate-200 text-slate-700'}`}>
            {index + 1}. {name}
          </div>
        ))}
      </div>
      <section className="rounded-2xl bg-white p-6 shadow">
        {step === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Address line 1" className="rounded border px-3 py-2" />
            <input placeholder="Address line 2" className="rounded border px-3 py-2" />
            <input placeholder="City" className="rounded border px-3 py-2" />
            <input placeholder="Postal code" className="rounded border px-3 py-2" />
          </div>
        ) : null}
        {step === 1 ? (
          <div className="space-y-2">
            <label className="flex items-center gap-2"><input type="radio" name="delivery" defaultChecked /> Email delivery updates</label>
            <label className="flex items-center gap-2"><input type="radio" name="delivery" /> WhatsApp delivery updates</label>
          </div>
        ) : null}
        {step === 2 ? <p>Razorpay integration endpoint is ready on backend: <code>/api/checkout/create</code>.</p> : null}
      </section>
      <div className="flex gap-3">
        <button disabled={step === 0} onClick={() => setStep((current) => current - 1)} className="rounded border px-5 py-2 disabled:opacity-50">Back</button>
        <button onClick={handleNext} className="rounded bg-pink-600 px-5 py-2 font-semibold text-white">{step === steps.length - 1 ? 'Place Order' : 'Next'}</button>
      </div>
      {message ? <p className="rounded-xl bg-emerald-100 p-3 text-sm text-emerald-900">{message}</p> : null}
    </div>
  );
}
