'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthToken, setRefreshToken } from '@/lib/storage';

const apiBase = import.meta.env.VITE_API_URL || '/api';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
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

        setAuthToken(body.accessToken);
        setRefreshToken(body.refreshToken);
        setMessage('Login successful! Redirecting...');
        setTimeout(() => navigate('/'), 1500);
      } catch {
        setMessage('Verification failed.');
      }
    }

    verify();
  }, []);

  return <p className="rounded-xl bg-white p-6 shadow">{message}</p>;
}
