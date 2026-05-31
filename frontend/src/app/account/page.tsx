import Link from 'next/link';

export default function AccountPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black">Your Account</h1>
      <p className="rounded-xl bg-white p-4 shadow">Manage your profile, saved addresses, and order history.</p>
      <Link href="/orders/detail?id=demo-order" className="inline-block rounded bg-slate-900 px-4 py-2 font-semibold text-white">View Order History</Link>
    </div>
  );
}
