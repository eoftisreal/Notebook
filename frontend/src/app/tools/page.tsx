"use client";

import { motion } from "framer-motion";
import { Link2, FileText, Search, Plus } from "lucide-react";

export default function ToolsDashboard() {
  return (
    <div className="pt-32 pb-20 container mx-auto px-6 relative z-10 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-2"
          >
            Your <span className="text-gradient">Dashboard</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400"
          >
            Manage and run your utility tools from one unified space.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 w-full md:w-auto"
        >
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tools..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 transition-colors text-white">
            <Plus className="w-5 h-5" />
          </button>
        </motion.div>
      </div>

      {/* Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* Tool Card 1 */}
        <div className="glass-panel p-6 rounded-3xl group cursor-pointer hover:border-orange-500/50 transition-all flex flex-col h-full">
          <div className="flex items-start justify-between mb-6">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Link2 className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium border border-green-500/20">Active</span>
          </div>
          <h3 className="text-xl font-bold mb-2">Link Resolver Pro</h3>
          <p className="text-sm text-slate-400 mb-6 flex-grow">
            Bypass redirects, extract hidden links, and resolve multi-threaded downloads automatically.
          </p>
          <button className="w-full py-3 rounded-xl bg-white/5 group-hover:bg-orange-500 text-sm font-medium transition-colors">
            Launch Tool
          </button>
        </div>

        {/* Tool Card 2 */}
        <div className="glass-panel p-6 rounded-3xl group cursor-pointer hover:border-blue-500/50 transition-all flex flex-col h-full">
          <div className="flex items-start justify-between mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium border border-green-500/20">Active</span>
          </div>
          <h3 className="text-xl font-bold mb-2">PDF Analyzer</h3>
          <p className="text-sm text-slate-400 mb-6 flex-grow">
            Client-side processing engine. Merge, split, compress, and organize PDF documents securely.
          </p>
          <button className="w-full py-3 rounded-xl bg-white/5 group-hover:bg-blue-500 text-sm font-medium transition-colors">
            Launch Tool
          </button>
        </div>

        {/* Coming Soon Placeholder */}
        <div className="glass-panel border-dashed border-white/20 p-6 rounded-3xl flex flex-col items-center justify-center text-center h-[280px]">
          <div className="w-12 h-12 rounded-full border border-dashed border-white/30 flex items-center justify-center text-slate-500 mb-4">
            <Plus className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-300 mb-2">Request a Tool</h3>
          <p className="text-sm text-slate-500 max-w-[200px]">
            Need a custom utility? Our engineers can build it for your workspace.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
