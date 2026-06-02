'use client';

import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function LoginForm() {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('Logging in...');

    try {
      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const body = await response.json();
      if (response.ok) {
        setToken(body.token, body.user);
        setMessage('Success!');
        navigate('/');
      } else {
        setMessage(body.message || 'Invalid credentials');
      }
    } catch {
      setMessage('An error occurred during login');
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow">
      <h1 className="text-2xl font-black">Log In</h1>
      <p className="mt-2 text-sm text-slate-600">Log in using your phone number or unique username.</p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          type="text"
          required
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Phone Number or Username"
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
        <button className="w-full rounded bg-brand-purple hover:bg-brand-pink px-4 py-2 font-semibold text-white">Log In</button>
      </form>

      {message ? <p className="mt-3 text-sm text-center text-slate-700">{message}</p> : null}

      <div className="mt-4 flex flex-col items-center gap-2 text-sm">
        <Link to="/auth/forgot-password" className="text-brand-purple hover:underline">Forgot password?</Link>
        <Link to="/auth/signup" className="text-slate-600 hover:text-brand-purple hover:underline">Don't have an account? Sign up</Link>
      </div>
    </div>
  );
}
