import { Users, ShoppingBag, DollarSign, Activity } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Dashboard Overview</h1>
        <div className="text-sm text-slate-500 bg-white px-3 py-1.5 rounded-full border shadow-sm">
          Last 30 Days
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Users</p>
            <p className="text-2xl font-bold">1,248</p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-50 text-green-600">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Orders</p>
            <p className="text-2xl font-bold">384</p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-brand-purple/10 text-brand-purple">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Revenue</p>
            <p className="text-2xl font-bold">₹124,500</p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Sessions</p>
            <p className="text-2xl font-bold">42</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm border border-slate-100 h-96 flex items-center justify-center text-slate-400">
          [ Revenue Chart Placeholder ]
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 h-96 flex items-center justify-center text-slate-400">
          [ Recent Activity Placeholder ]
        </div>
      </div>
    </div>
  );
}
