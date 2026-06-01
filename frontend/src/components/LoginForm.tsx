'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('Sending magic link...');

    try {
      const response = await fetch(`${apiBase}/auth/magic-link/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const body = await response.json();
      setMessage(response.ok ? 'Check your inbox for your login link.' : body.message || 'Failed to send link');
    } catch {
      setMessage('Failed to send link');
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow">
      <h1 className="text-2xl font-black">Passwordless Login</h1>
      <p className="mt-2 text-sm text-slate-600">Use your email and we’ll send a secure magic sign-in link.</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded border px-3 py-2" />
        <button className="w-full rounded bg-brand-purple hover:bg-brand-pink px-4 py-2 font-semibold text-white">Send Magic Link</button>
      </form>
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
      <div className="mt-4 text-center text-sm">
        <Link href="/auth/signup" className="text-brand-purple hover:underline">Don't have an account? Sign up</Link>
      </div>
    </div>
  );
}
