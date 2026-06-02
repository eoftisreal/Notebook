import { useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/storage';
import { parseJwt } from '@/lib/jwt';

const apiBase = import.meta.env.VITE_API_URL || '/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = getAuthToken();
  const payload = token ? parseJwt(token) : null;
  const isMasterAdmin = payload?.role === 'master_admin';

  useEffect(() => {
    if (isMasterAdmin) {
      fetchSettings();
    } else {
      setLoading(false);
      setError('Master Admin access required.');
    }
  }, [isMasterAdmin]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${apiBase}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setSettings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">Platform Settings</h1>
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold mb-4">Configuration</h2>
        <pre className="bg-slate-50 p-4 rounded text-sm overflow-x-auto text-slate-700">
          {JSON.stringify(settings, null, 2)}
        </pre>
        <p className="mt-4 text-sm text-slate-500">Settings are currently read-only.</p>
      </div>
    </div>
  );
}
