'use client';


import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { apiPost } from '@/lib/api';

import { apiGet } from '@/lib/api';
import { useParams } from 'react-router-dom';


type OrderItem = {
  title: string;
  quantity: number;
  unitPrice: number;
  productId: string;
};

type Order = {
  _id: string;
  status: string;
  paymentAmount?: number;
  qrGeneratedAt?: string;
  timeline: { status: string; note?: string; at: string }[];
  items?: OrderItem[];
};


import { Suspense } from 'react';


function OrderTrackingContent() {
  const { id } = useParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState<{ upiUrl: string, expiresAt: string, paymentAmount: number, upiId: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [utr, setUtr] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploading, setUploading] = useState(false);


  useEffect(() => {
    let active = true;

    async function fetchOrder() {
      if (!id) {
        if (active) setLoading(false);
        return;
      }

      try {
        const data = await apiGet<Order>(`/orders/${id}`);
        if (active) {
          setOrder(data);
          if (data.status === 'pending_payment' && !qrData) {
            generateQrCode(id);
          }
        }
      } catch {
        if (active) setOrder(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchOrder();

    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (qrData?.expiresAt) {
      if (timerRef.current) clearInterval(timerRef.current);

      const targetTime = new Date(qrData.expiresAt).getTime();

      const updateTimer = () => {
        const now = new Date().getTime();
        const difference = targetTime - now;

        if (difference <= 0) {
          setTimeLeft(0);
          if (timerRef.current) clearInterval(timerRef.current);
        } else {
          setTimeLeft(Math.floor(difference / 1000));
        }
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [qrData?.expiresAt]);

  const generateQrCode = async (orderId: string) => {
    setQrLoading(true);
    setQrError('');
    try {
      const data = await apiPost<any>(`/orders/${orderId}/generate-qr`, {});
      setQrData(data);
    } catch (err: any) {
      setQrError(err.message || 'Failed to generate QR Code');
    } finally {
      setQrLoading(false);
    }
  };


  const markPaymentDone = async (fallbackData?: { utr?: string; screenshotUrl?: string }) => {
    if (!id) return;
    try {
      const data = await apiPost<Order>(`/orders/${id}/payment-done`, fallbackData || {});
      setOrder(data);
      if (!fallbackData) {
        setQrData(null);
      } else {
        alert('Verification proof submitted successfully');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to mark payment as done');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('kapdakraft_token');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${apiBase}/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setScreenshotUrl(data.url);
    } catch (err) {
      alert('Failed to upload screenshot. Please make sure R2 is configured.');
    } finally {
      setUploading(false);
    }
  };


  if (loading) {
    return <p className="rounded-md bg-white p-6 border border-secondary-bg">Loading order...</p>;
  }

  if (!order) {
    return <p className="rounded-md bg-white p-6 border border-secondary-bg">Order not found.</p>;
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Order #{order._id.slice(-6)}</h1>

      {order.status === 'pending_payment' && (
        <div className="bg-white p-6 rounded-md border border-secondary-bg">
          <h2 className="text-xl font-bold mb-4">Complete Your Payment</h2>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <p className="text-sm text-slate-600">Please scan the QR code to pay using any UPI app.</p>

              <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Total Amount Due</p>
                <p className="text-3xl font-black">₹{qrData ? qrData.paymentAmount : order.paymentAmount}</p>
                <p className="text-xs text-red-500 mt-1 font-medium">Important: Pay exactly this amount for successful verification.</p>
              </div>

              {qrData?.upiId && (
                <div className="mt-2">
                  <p className="text-xs text-slate-500">UPI ID: {qrData.upiId}</p>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center">
              {qrLoading ? (
                <div className="w-48 h-48 bg-slate-100 animate-pulse flex items-center justify-center rounded-md">
                  Generating QR...
                </div>
              ) : qrError ? (
                <div className="w-48 h-48 bg-red-50 flex flex-col items-center justify-center text-red-500 border border-red-200 rounded-md p-4 text-center">
                  <p className="text-sm">{qrError}</p>
                  <button onClick={() => generateQrCode(order._id)} className="mt-2 underline text-sm">Retry</button>
                </div>
              ) : qrData ? (
                <div className="flex flex-col items-center">
                  <div className="bg-white p-2 border-2 border-slate-200 rounded-lg shadow-sm">
                    {timeLeft > 0 ? (
                      <QRCodeSVG value={qrData.upiUrl} size={192} />
                    ) : (
                      <div className="w-48 h-48 bg-slate-100 flex items-center justify-center rounded-md">
                        <p className="text-sm text-slate-500 font-medium">QR Expired</p>
                      </div>
                    )}
                  </div>

                  {timeLeft > 0 ? (
                    <p className="mt-3 text-sm font-medium text-slate-600">
                      QR expires in <span className="font-bold text-red-600">{formatTime(timeLeft)}</span>
                    </p>
                  ) : (
                    <button
                      onClick={() => generateQrCode(order._id)}
                      className="mt-3 text-sm font-bold bg-slate-200 px-4 py-2 rounded-md hover:bg-slate-300 transition-colors"
                    >
                      Generate New QR
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
            <button
              onClick={() => markPaymentDone()}
              disabled={timeLeft === 0}
              className="bg-foreground text-white px-6 py-3 rounded-md font-bold hover:bg-black disabled:opacity-50 transition-colors"
            >
              I Have Made The Payment
            </button>
          </div>
        </div>
      )}


      {order.status === 'awaiting_verification' && (
        <div className="bg-yellow-50 p-6 rounded-md border border-yellow-200 text-yellow-800 space-y-4">
          <h2 className="text-xl font-bold mb-2">Payment Submitted</h2>
          <p>We are verifying your payment. Please wait. This process requires manual review by our team and may take a few minutes.</p>

          <div className="bg-white p-4 rounded border border-yellow-300 mt-4">
            <h3 className="font-semibold mb-2">Delayed Verification?</h3>
            <p className="text-sm mb-4">If verification is taking longer than expected, you can optionally provide payment proof below to expedite the process.</p>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter UTR / RRN Number"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full border rounded px-3 py-2 text-sm bg-slate-50"
                  disabled={uploading}
                />
                {uploading && <p className="text-xs mt-1 text-slate-500">Uploading...</p>}
                {screenshotUrl && <p className="text-xs mt-1 text-green-600">Screenshot uploaded successfully</p>}
              </div>
              <button
                onClick={() => markPaymentDone({ utr, screenshotUrl })}
                disabled={(!utr && !screenshotUrl) || uploading}
                className="bg-yellow-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-yellow-700 disabled:opacity-50"
              >
                Submit Proof
              </button>
            </div>
          </div>
        </div>
      )}


      {order.status === 'payment_verified' && (
        <div className="bg-green-50 p-6 rounded-md border border-green-200 text-green-800">
          <h2 className="text-xl font-bold mb-2">Payment Verified</h2>
          <p>Your payment has been successfully verified! Order processing has started.</p>
        </div>
      )}

      {order.status === 'rejected' && (
        <div className="bg-red-50 p-6 rounded-md border border-red-200 text-red-800">
          <h2 className="text-xl font-bold mb-2">Payment Rejected</h2>
          <p>Your payment could not be verified. Please try again or contact support.</p>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-bold mt-8">Order Status History</h2>
        <div className="grid gap-3">
          {order.timeline.map((event, index) => (
            <article key={`${event.status}-${index}`} className="rounded-md bg-white p-4 border border-secondary-bg">
              <p className="font-bold capitalize">{event.status.replace('_', ' ')}</p>
              {event.note ? <p className="text-sm text-slate-600">{event.note}</p> : null}
              <p className="text-xs text-slate-400 mt-1">{new Date(event.at).toLocaleString()}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<p className="rounded-md bg-white p-6 border border-secondary-bg">Loading order tracking...</p>}>
      <OrderTrackingContent />
    </Suspense>
  );
}
