import { apiGet } from '@/lib/api';

type Order = {
  _id: string;
  status: string;
  timeline: { status: string; note?: string; at: string }[];
};

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let order: Order | null = null;
  try {
    order = await apiGet<Order>(`/orders/${id}`);
  } catch {
    order = null;
  }

  if (!order) {
    return <p className="rounded-xl bg-white p-6 shadow">Order not found.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black">Track Order #{order._id.slice(-6)}</h1>
      <p className="rounded-xl bg-white p-4 shadow">Current status: <strong>{order.status}</strong></p>
      <div className="space-y-2">
        {order.timeline.map((event, index) => (
          <article key={`${event.status}-${index}`} className="rounded-xl bg-white p-4 shadow">
            <p className="font-bold">{event.status}</p>
            {event.note ? <p className="text-sm text-slate-600">{event.note}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}
