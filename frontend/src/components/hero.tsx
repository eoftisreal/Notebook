"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">

        {/* Left Content */}
        <motion.div
          style={{ opacity }}
          className="flex flex-col items-start gap-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm font-medium text-orange-400"
          >
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Next-Gen Tools Ecosystem
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1]"
          >
            Accelerate <br/>
            Your <span className="text-gradient">Workflow.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg md:text-xl text-slate-400 max-w-md leading-relaxed"
          >
            CoinRx provides a futuristic, high-performance suite of utility tools designed for modern professionals and agencies.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center gap-4 mt-4"
          >
            <Link
              href="/tools"
              className="group relative px-8 py-4 bg-white text-black rounded-full font-semibold overflow-hidden transition-all hover:scale-105 flex items-center gap-2"
            >
              <span className="relative z-10 flex items-center gap-2">
                Explore Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-orange-500 transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out z-0" />
            </Link>

            <Link href="#features" className="px-8 py-4 text-white font-medium hover:text-orange-400 transition-colors">
              View Features
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="flex items-center gap-8 mt-8 border-t border-white/10 pt-8 w-full max-w-md"
          >
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold text-white">99.9%</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Uptime</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold text-white">50x</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Faster</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold text-white">24/7</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Support</span>
            </div>
          </motion.div>

        </motion.div>

        {/* Right 3D Asset */}
        <motion.div
          style={{ y: y1 }}
          className="relative h-[600px] w-full hidden lg:flex items-center justify-center"
        >
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotateZ: [0, 2, -2, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative w-full h-full drop-shadow-[0_0_50px_rgba(249,115,22,0.3)]"
          >
            {/* The provided Ampersand 3D element */}
            <Image
              src="/ampersand.png"
              alt="CoinRx 3D Logo"
              fill
              className="object-contain scale-110"
              priority
            />
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}
