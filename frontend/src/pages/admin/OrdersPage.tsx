import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { fetchWithAuth } from '@/lib/apiClient';
import { getAuthToken } from '@/lib/storage';
import { Search } from 'lucide-react';

const apiBase = import.meta.env.VITE_API_URL || '/api';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetchWithAuth(`${apiBase}/orders`, {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        });
        if (res.ok) {
          setOrders(await res.json());
        }
      } catch (e) {
        console.error('Failed to fetch orders', e);
      }
    }
    fetchOrders();
  }, []);


  const handleApprove = async (id: string) => {
    try {
      const res = await fetchWithAuth(`${apiBase}/admin/orders/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders(orders.map(o => o._id === id ? updated : o));
      } else {
        alert('Failed to approve payment');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetchWithAuth(`${apiBase}/admin/orders/${id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Payment not found in bank statement.' })
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders(orders.map(o => o._id === id ? updated : o));
      } else {
        alert('Failed to reject payment');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredOrders = orders.filter(o => {

    const term = searchTerm.toLowerCase();
    const matchSearch = o._id.toLowerCase().includes(term) ||
                        (o.guestEmail && o.guestEmail.toLowerCase().includes(term)) ||
                        (o.userId && o.userId.email && o.userId.email.toLowerCase().includes(term));
    const matchStatus = statusFilter === '' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Manage Orders</h1>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-md border border-secondary-bg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Order ID or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border rounded text-sm focus:outline-none focus:border-foreground"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-border rounded px-4 py-2 text-sm focus:outline-none focus:border-foreground bg-white sm:w-48"
        >
          <option value="">All Statuses</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="awaiting_verification">Awaiting Verification</option>
          <option value="payment_verified">Payment Verified</option>
          <option value="rejected">Rejected</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

      </div>

      <div className="bg-white rounded-md border border-secondary-bg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">

            <thead className="bg-secondary-bg">
              <tr>
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Payment Verification</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Total (Expected)</th>
                <th className="px-4 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>


            <tbody className="divide-y divide-secondary-bg">
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (

                  <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium">#{order._id.slice(-6)}</td>
                    <td className="px-4 py-3 text-secondary-text">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-secondary-text">
                      {order.guestEmail || (order.userId && order.userId.email) || 'N/A'}
                    </td>


                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div>
                        <span className="font-semibold block text-slate-800">Expected: ₹{order.paymentAmount}</span>
                      </div>
                      {order.paymentSubmittedAt && (
                        <div className="mt-1">
                          <span className="block">Submitted: {new Date(order.paymentSubmittedAt).toLocaleString()}</span>
                        </div>
                      )}
                      {order.paymentUtr && (
                        <div className="mt-1">
                          <span className="block font-medium">UTR: {order.paymentUtr}</span>
                        </div>
                      )}
                      {order.paymentScreenshotUrl && (
                        <div className="mt-1">
                          <a href={order.paymentScreenshotUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">View Screenshot</a>
                        </div>
                      )}
                    </td>


                    <td className="px-4 py-3">
                      <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded border border-border bg-secondary-bg text-secondary-text">
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">₹{order.total}</td>
                    <td className="px-4 py-3 text-center">
                      {order.status === 'awaiting_verification' && (
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => handleApprove(order._id)} className="text-green-600 hover:text-green-800" title="Approve Payment">
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleReject(order._id)} className="text-red-600 hover:text-red-800" title="Reject Payment">
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-secondary-text">
                    No orders found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}
