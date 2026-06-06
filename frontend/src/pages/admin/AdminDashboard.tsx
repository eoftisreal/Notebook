import { fetchWithAuth } from "@/lib/apiClient";

import { useEffect, useState } from 'react';
import { ShoppingBag, DollarSign, Activity, Package } from 'lucide-react';
import { getAuthToken } from '@/lib/storage';

const apiBase = import.meta.env.VITE_API_URL || '/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetchWithAuth(`${apiBase}/admin/analytics`, {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        });
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (e) {
        console.error('Failed to fetch stats', e);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Dashboard Overview</h1>
        <div className="text-sm text-slate-500 bg-white px-3 py-1.5 rounded-full border ">
          Last 30 Days
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md bg-white p-6 border border-secondary-bg flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Products</p>
            <p className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-md bg-white p-6 border border-secondary-bg flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-50 text-green-600">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Orders</p>
            <p className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-md bg-white p-6 border border-secondary-bg flex items-center gap-4">
          <div className="p-3 rounded-lg bg-foreground/10 text-foreground">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Revenue</p>
            <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-md bg-white p-6 border border-secondary-bg flex items-center gap-4 opacity-50">
          <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Sessions</p>
            <p className="text-2xl font-bold">--</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-md bg-white p-6 border border-secondary-bg h-96 flex items-center justify-center text-slate-400">
          [ Revenue Chart Placeholder ]
        </div>
        <div className="rounded-md bg-white p-6 border border-secondary-bg h-96 flex items-center justify-center text-slate-400">
          [ Recent Activity Placeholder ]
        </div>
      </div>
    </div>
  );
}
