import MediaUpload from '@/components/MediaUpload';

export default function AdminPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <section className="rounded-xl bg-white p-4 shadow">
          <h2 className="font-bold">Products</h2>
          <p className="text-sm text-slate-600">Create, edit, and archive listings.</p>
        </section>
        <section className="rounded-xl bg-white p-4 shadow">
          <h2 className="font-bold">Orders</h2>
          <p className="text-sm text-slate-600">Update fulfillment and tracking status.</p>
        </section>
        <section className="rounded-xl bg-white p-4 shadow">
          <h2 className="font-bold">Analytics</h2>
          <p className="text-sm text-slate-600">Monitor revenue and artist trends.</p>
        </section>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MediaUpload />
      </div>
    </div>
  );
}
