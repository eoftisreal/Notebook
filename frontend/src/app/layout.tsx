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
  title: "eoftisreal – Tools",
  description: "A personal portal for PDF tools, Link Resolver, and portfolio.",
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

        <footer className="py-8 border-t border-white/10 text-center text-slate-500 text-sm mt-auto relative z-10 bg-[#0f172a]">
          <p>© {new Date().getFullYear()} eoftisreal. Personal tools portal.</p>
        </footer>
      </body>
    </html>
  );
}
