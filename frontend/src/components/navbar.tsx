"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5"
    >
      <Link href="/" className="font-bold text-xl tracking-tight text-white hover:text-orange-400 transition-colors">
        eoftisreal
      </Link>

      <div className="flex items-center gap-6 text-sm font-medium text-slate-300">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <Link href="/about" className="hover:text-white transition-colors">About</Link>
        <Link href="/tools/pdf-rotator" className="hover:text-white transition-colors">PDF Rotator</Link>
        <Link href="/tools/pdf-analyzer" className="hover:text-white transition-colors">PDF Analyzer</Link>
        <Link
          href="/tools/link-resolver"
          className="px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          Link Resolver
        </Link>
      </div>
    </motion.nav>
  );
}
