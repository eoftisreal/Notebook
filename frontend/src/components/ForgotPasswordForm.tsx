'use client';

import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function ForgotPasswordForm() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  async function sendOtp(event: FormEvent) {
    event.preventDefault();
    setMessage('Sending OTP...');

    try {
      const response = await fetch(`${apiBase}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const body = await response.json();
      if (response.ok) {
        setMessage(body.skipped ? 'OTP sent (Check server logs)' : 'OTP sent successfully!');
        setStep(2);
      } else {
        setMessage(body.message || 'Failed to send OTP');
      }
    } catch {
      setMessage('Failed to send OTP');
    }
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    setMessage('Resetting password...');

    try {
      const response = await fetch(`${apiBase}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, newPassword }),
      });

      const body = await response.json();
      if (response.ok) {
        setMessage('Password reset successfully! You can now log in.');
        setTimeout(() => navigate('/auth/login'), 2000);
      } else {
        setMessage(body.message || 'Failed to reset password');
      }
    } catch {
      setMessage('Failed to reset password');
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow">
      <h1 className="text-2xl font-black">Reset Password</h1>

      {step === 1 && (
        <>
          <p className="mt-2 text-sm text-slate-600">Enter your phone number to receive an OTP to reset your password.</p>
          <form onSubmit={sendOtp} className="mt-4 space-y-3">
            <input
              type="text"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Phone Number"
              className="w-full rounded border px-3 py-2"
            />
            <button className="w-full rounded bg-brand-purple hover:bg-brand-pink px-4 py-2 font-semibold text-white">Send OTP</button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <p className="mt-2 text-sm text-slate-600">Enter the OTP and your new password.</p>
          <form onSubmit={resetPassword} className="mt-4 space-y-3">
            <input
              type="text"
              required
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="6-digit OTP"
              className="w-full rounded border px-3 py-2 bg-slate-50"
            />
            <input
              type="password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New Password"
              className="w-full rounded border px-3 py-2"
            />
            <button className="w-full rounded bg-brand-purple hover:bg-brand-pink px-4 py-2 font-semibold text-white mt-4">Reset Password</button>
          </form>
        </>
      )}

      {message ? <p className="mt-3 text-sm text-center text-slate-700">{message}</p> : null}

      <div className="mt-4 text-center text-sm">
        <Link to="/auth/login" className="text-brand-purple hover:underline">Back to Login</Link>
      </div>
    </div>
  );
}
