import Link from 'next/link';

export default function AccountPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black">Your Account</h1>
      <p className="rounded-xl bg-white p-4 shadow">Manage your profile, saved addresses, and order history.</p>
      <Link href="/orders" className="inline-block rounded bg-brand-purple hover:bg-brand-pink px-4 py-2 font-semibold text-white">View Order History</Link>
    </div>
  );
}
