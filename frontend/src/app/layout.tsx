import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CoinRx - Premium Tools Ecosystem",
  description: "A futuristic creative SaaS platform for advanced utility tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0f172a] text-slate-50 min-h-screen flex flex-col`}
      >
        <Navbar />
        <main className="flex-1 flex flex-col relative">{children}</main>

        <footer className="py-12 border-t border-white/10 text-center text-slate-500 text-sm mt-auto relative z-10 bg-[#0f172a]">
          <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white text-xs">
                C
              </div>
              <span className="font-bold text-slate-300">CoinRx</span>
            </div>
            <p>© {new Date().getFullYear()} CoinRx Ecosystem. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-orange-500 transition-colors">Privacy</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Terms</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
