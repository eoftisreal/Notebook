'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('Creating account and sending magic link...');

    try {
      const response = await fetch(`${apiBase}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const body = await response.json();
      setMessage(response.ok ? 'Account created! Check your inbox for your secure sign-in link.' : body.message || 'Failed to create account');
    } catch {
      setMessage('Failed to create account');
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow">
      <h1 className="text-2xl font-black">Create an Account</h1>
      <p className="mt-2 text-sm text-slate-600">Enter your name and email. We’ll send you a passwordless magic link to sign in.</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your Name"
          className="w-full rounded border px-3 py-2"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full rounded border px-3 py-2"
        />
        <button className="w-full rounded bg-brand-purple hover:bg-brand-pink px-4 py-2 font-semibold text-white">Create Account</button>
      </form>
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
      <div className="mt-4 text-center text-sm">
        <Link href="/auth/login" className="text-brand-purple hover:underline">Already have an account? Log in</Link>
      </div>
    </div>
  );
}
