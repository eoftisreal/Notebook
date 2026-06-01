import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-brand-dark antialiased">
      <Header />
      <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
