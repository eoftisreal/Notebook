"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 mix-blend-difference text-white"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white">
          C
        </div>
        <span className="font-bold text-xl tracking-tight">CoinRx</span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium">
        <Link href="/" className="hover:text-orange-500 transition-colors">Home</Link>
        <Link href="/tools" className="hover:text-orange-500 transition-colors">Tools</Link>
        <Link href="#features" className="hover:text-orange-500 transition-colors">Features</Link>
        <Link href="#pricing" className="hover:text-orange-500 transition-colors">Pricing</Link>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/contact" className="hidden md:block text-sm font-medium hover:text-orange-500 transition-colors">
          Contact
        </Link>
        <Link href="/tools" className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-orange-500 hover:text-white transition-all duration-300">
          Launch Dashboard
        </Link>
      </div>
    </motion.nav>
  );
}
