'use client';

import { useEffect, useState } from 'react';
import { setAuthToken } from '@/lib/storage';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Verifying magic link...');

  useEffect(() => {
    async function verify() {
      const token = new URLSearchParams(window.location.search).get('token');
      if (!token) {
        setMessage('Missing magic token.');
        return;
      }

      try {
        const response = await fetch(`${apiBase}/auth/magic-link/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const body = await response.json();
        if (!response.ok) {
          setMessage(body.message || 'Verification failed.');
          return;
        }

        setAuthToken(body.token);
        setMessage('Login successful! You can now continue shopping.');
      } catch {
        setMessage('Verification failed.');
      }
    }

    verify();
  }, []);

  return <p className="rounded-xl bg-white p-6 shadow">{message}</p>;
}
