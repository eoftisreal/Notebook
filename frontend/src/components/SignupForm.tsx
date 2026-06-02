'use client';

import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function SignupForm() {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);

  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [landmark, setLandmark] = useState('');

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

  async function completeSignup(event: FormEvent) {
    event.preventDefault();
    setMessage('Creating account...');

    try {
      const response = await fetch(`${apiBase}/auth/signup-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          otp,
          username,
          password,
          name,
          address: { state, district, pinCode, landmark }
        }),
      });

      const body = await response.json();
      if (response.ok) {
        setToken(body.token, body.user);
        setMessage('Account created successfully!');
        navigate('/');
      } else {
        setMessage(body.message || 'Failed to create account');
      }
    } catch {
      setMessage('Failed to create account');
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow">
      <h1 className="text-2xl font-black">Create an Account</h1>

      {step === 1 && (
        <>
          <p className="mt-2 text-sm text-slate-600">Enter your phone number to receive a verification code.</p>
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
          <p className="mt-2 text-sm text-slate-600">Enter the OTP and your details to complete setup.</p>
          <form onSubmit={completeSignup} className="mt-4 space-y-3">
            <input
              type="text"
              required
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="6-digit OTP"
              className="w-full rounded border px-3 py-2 bg-slate-50"
            />
            <input
              type="text"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Unique Username"
              className="w-full rounded border px-3 py-2"
            />
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full Name"
              className="w-full rounded border px-3 py-2"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded border px-3 py-2"
            />

            <h3 className="text-sm font-semibold mt-4">Address Details</h3>
            <input
              type="text"
              required
              value={state}
              onChange={(event) => setState(event.target.value)}
              placeholder="State"
              className="w-full rounded border px-3 py-2"
            />
            <input
              type="text"
              required
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
              placeholder="District"
              className="w-full rounded border px-3 py-2"
            />
            <input
              type="text"
              value={pinCode}
              onChange={(event) => setPinCode(event.target.value)}
              placeholder="Pin Code (Optional)"
              className="w-full rounded border px-3 py-2"
            />
            <input
              type="text"
              value={landmark}
              onChange={(event) => setLandmark(event.target.value)}
              placeholder="Landmark (Optional)"
              className="w-full rounded border px-3 py-2"
            />

            <button className="w-full rounded bg-brand-purple hover:bg-brand-pink px-4 py-2 font-semibold text-white mt-4">Complete Signup</button>
          </form>
        </>
      )}

      {message ? <p className="mt-3 text-sm text-center text-slate-700">{message}</p> : null}

      <div className="mt-4 text-center text-sm">
        <Link to="/auth/login" className="text-brand-purple hover:underline">Already have an account? Log in</Link>
      </div>
    </div>
  );
}
