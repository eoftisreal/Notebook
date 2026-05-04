import Hero from "@/components/hero";
import { Shield, Zap, Lock, Blocks } from "lucide-react";

export default function Home() {
  return (
    <>
      <Hero />

      {/* Features Section */}
      <section id="features" className="py-32 relative bg-[#0f172a] z-10">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Engineered for <span className="text-gradient">Scale</span></h2>
            <p className="text-slate-400 text-lg">
              Our infrastructure is built to handle enterprise workloads while maintaining a frictionless developer experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="glass-panel p-8 rounded-3xl hover:border-orange-500/50 transition-colors group cursor-default">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-orange-500/20 transition-all text-white group-hover:text-orange-400">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Ecosystem Preview */}
      <section className="py-32 relative bg-black/20 z-10 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Powerful <span className="text-gradient">Ecosystem</span></h2>
              <p className="text-slate-400 text-lg">
                Discover our suite of high-performance utilities, currently featuring advanced Link Resolution and PDF Analysis tools.
              </p>
            </div>
            <a href="/tools" className="px-6 py-3 rounded-full border border-white/20 hover:border-orange-500 hover:text-orange-400 transition-colors inline-flex items-center gap-2">
              View All Tools <Zap className="w-4 h-4" />
            </a>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-panel p-10 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <h3 className="text-2xl font-bold mb-4">Link Resolver Pro</h3>
              <p className="text-slate-400 mb-8 max-w-sm">
                Automated multi-threaded extraction and bypassing system. Resolve complex URLs with unprecedented speed.
              </p>
              <div className="w-full h-48 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center">
                <span className="text-slate-600 font-mono text-sm">Dashboard Preview</span>
              </div>
            </div>

            <div className="glass-panel p-10 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <h3 className="text-2xl font-bold mb-4">PDF Analyzer</h3>
              <p className="text-slate-400 mb-8 max-w-sm">
                Client-side, secure document manipulation. Merge, split, and optimize PDFs without server uploads.
              </p>
              <div className="w-full h-48 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center">
                <span className="text-slate-600 font-mono text-sm">Dashboard Preview</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser / CTA */}
      <section id="pricing" className="py-40 relative z-10">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-8">Ready to upgrade?</h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Join thousands of professionals using CoinRx to streamline their daily workflows. Start for free today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/tools" className="px-8 py-4 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors text-lg">
              Start Free Trial
            </a>
            <a href="#contact" className="px-8 py-4 border border-white/20 rounded-full font-semibold hover:bg-white/5 transition-colors text-lg">
              Contact Sales
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

const features = [
  {
    icon: <Zap />,
    title: "Lightning Fast",
    desc: "Optimized infrastructure utilizing global edge networks for sub-second response times."
  },
  {
    icon: <Shield />,
    title: "Bank-grade Security",
    desc: "End-to-end encryption with zero-knowledge architecture on client-side tools."
  },
  {
    icon: <Blocks />,
    title: "Modular APIs",
    desc: "Integrate our tools directly into your own applications with our robust developer API."
  },
  {
    icon: <Lock />,
    title: "Privacy First",
    desc: "We don't store your files or track your links. Your data remains yours."
  }
];
