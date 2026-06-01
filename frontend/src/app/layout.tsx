import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Kapda Kraft',
  description: 'Playful ecommerce marketplace for indie artists and creative shoppers.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-brand-dark antialiased">
        <Header />
        <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
