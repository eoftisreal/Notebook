'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/storage';
import { useCartStore } from '@/store/cart';

const apiBase = import.meta.env.VITE_API_URL || '/api';

const steps = ['Address', 'Delivery', 'Payment'];

type CheckoutData = {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  deliveryMethod: 'email' | 'whatsapp';
};

export default function CheckoutForm() {
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');

  const [formData, setFormData] = useState<CheckoutData>({
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    deliveryMethod: 'email'
  });

  const [deliverySettings, setDeliverySettings] = useState({
    enableEmailDelivery: true,
    enableWhatsappDelivery: true,
    customFeatureIconUrl: ''
  });

  const { items, fetchCart } = useCartStore();

  const isLoggedIn = !!getAuthToken();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    fetch(`${apiBase}/public/settings`)
      .then(res => res.json())
      .then(data => {
        setDeliverySettings({
          enableEmailDelivery: data.enableEmailDelivery !== false,
          enableWhatsappDelivery: data.enableWhatsappDelivery !== false,
          customFeatureIconUrl: data.customFeatureIconUrl || ''
        });

        // Auto-select whatsapp if email is disabled and whatsapp is enabled
        if (data.enableEmailDelivery === false && data.enableWhatsappDelivery !== false) {
          setFormData(prev => ({ ...prev, deliveryMethod: 'whatsapp' }));
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetch(`${apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setFormData(prev => ({
            ...prev,
            name: data.user.name || '',
            phone: data.user.phone || '',
            line1: data.user.address?.line1 || '',
            line2: data.user.address?.line2 || '',
            city: data.user.address?.city || '',
            state: data.user.address?.state || '',
            postalCode: data.user.address?.postalCode || '',
            country: data.user.address?.country || ''
          }));
        }
      })
      .catch(console.error);
    }
  }, [isLoggedIn]);

  const handleChange = (field: keyof CheckoutData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  async function handleNext() {
    if (step === 0 && isLoggedIn) {
      // Save profile updates before moving to step 1
      try {
        await fetch(`${apiBase}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            address: {
              line1: formData.line1,
              line2: formData.line2,
              city: formData.city,
              state: formData.state,
              postalCode: formData.postalCode,
              country: formData.country
            }
          })
        });
      } catch (err) {
        console.error('Failed to update profile', err);
      }
    }

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
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-3">Personal Details</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="Full Name" className="rounded border px-3 py-2" />
                <input value={formData.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="Phone Number" className="rounded border px-3 py-2" />
              </div>
            </div>
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-3">Shipping Address</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={formData.line1} onChange={e => handleChange('line1', e.target.value)} placeholder="Address line 1" className="rounded border px-3 py-2 sm:col-span-2" />
                <input value={formData.line2} onChange={e => handleChange('line2', e.target.value)} placeholder="Address line 2 (Optional)" className="rounded border px-3 py-2 sm:col-span-2" />
                <input value={formData.city} onChange={e => handleChange('city', e.target.value)} placeholder="City" className="rounded border px-3 py-2" />
                <input value={formData.state} onChange={e => handleChange('state', e.target.value)} placeholder="State" className="rounded border px-3 py-2" />
                <input value={formData.postalCode} onChange={e => handleChange('postalCode', e.target.value)} placeholder="Postal Code" className="rounded border px-3 py-2" />
                <input value={formData.country} onChange={e => handleChange('country', e.target.value)} placeholder="Country" className="rounded border px-3 py-2" />
              </div>
            </div>
          </div>
        ) : null}
        {step === 1 ? (
          <div className="space-y-8">
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
              <h2 className="text-lg font-semibold text-foreground mb-3">Order Summary</h2>
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className="flex gap-1 shrink-0 bg-white rounded border border-slate-200 p-0.5">
                      {item.image && (
                        <img src={item.image} alt={item.title} className="h-12 w-12 object-cover rounded" />
                      )}
                      {item.customImage && (
                        <img src={item.customImage} alt="Custom upload" className="h-12 w-12 object-contain bg-slate-100 rounded border border-dashed border-slate-300" />
                      )}
                      {item.customImage && deliverySettings.customFeatureIconUrl && (
                        <img src={deliverySettings.customFeatureIconUrl} alt="Custom feature" className="h-12 w-12 object-contain bg-slate-100 rounded border border-slate-200" title="Custom Design" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.title}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity} × ₹{item.unitPrice}</p>
                    </div>
                    <div className="font-semibold text-sm">
                      ₹{item.quantity * item.unitPrice}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mb-2 pt-4 border-t border-slate-200">
                <h2 className="text-lg font-semibold text-foreground">Review Details</h2>
                <button onClick={() => setStep(0)} className="text-sm font-medium text-pink-600 hover:text-pink-700">Edit Details</button>
              </div>
              <div className="text-sm text-slate-600 space-y-1">
                <p><span className="font-medium text-slate-800">Name:</span> {formData.name || 'Not provided'}</p>
                <p><span className="font-medium text-slate-800">Phone:</span> {formData.phone || 'Not provided'}</p>
                <p><span className="font-medium text-slate-800">Address:</span> {formData.line1} {formData.line2 ? `, ${formData.line2}` : ''}</p>
                <p>{formData.city}, {formData.state} {formData.postalCode}</p>
                <p>{formData.country}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold mb-2">Delivery Updates</h3>
              {deliverySettings.enableEmailDelivery && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="delivery"
                    checked={formData.deliveryMethod === 'email'}
                    onChange={() => handleChange('deliveryMethod', 'email')}
                    className="cursor-pointer"
                  />
                  Email delivery updates
                </label>
              )}
              {deliverySettings.enableWhatsappDelivery && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="delivery"
                    checked={formData.deliveryMethod === 'whatsapp'}
                    onChange={() => handleChange('deliveryMethod', 'whatsapp')}
                    className="cursor-pointer"
                  />
                  WhatsApp delivery updates
                </label>
              )}
              {!deliverySettings.enableEmailDelivery && !deliverySettings.enableWhatsappDelivery && (
                <p className="text-sm text-slate-500 italic">Delivery updates are currently disabled.</p>
              )}
            </div>

            {isLoggedIn ? (
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
            ) : (
              <div className="border-t pt-4">
                <p className="text-sm text-slate-500">Please <a href="/auth/login" className="underline text-foreground">log in</a> to apply promo codes.</p>
              </div>
            )}
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
