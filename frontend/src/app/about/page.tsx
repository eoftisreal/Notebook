import { Code2, ExternalLink, Mail } from "lucide-react";

const projects = [
  {
    title: "Link Resolver Pro",
    desc: "Automated Selenium-based multi-threaded link resolver that bypasses redirect chains and extracts final download URLs.",
    href: "/tools/link-resolver",
    color: "green",
  },
  {
    title: "PDF Rotator",
    desc: "Client-side PDF page rotation tool built in Next.js + pdf-lib. No server, no uploads.",
    href: "/tools/pdf-rotator",
    color: "orange",
  },
  {
    title: "PDF Analyzer",
    desc: "Browser-based PDF inspection and compression utility — read page count, file size, and compress in one click.",
    href: "/tools/pdf-analyzer",
    color: "blue",
  },
];

const colorBorder: Record<string, string> = {
  green: "hover:border-green-500/50",
  orange: "hover:border-orange-500/50",
  blue: "hover:border-blue-500/50",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Profile */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3">
            Hey, I&apos;m <span className="text-gradient">eoftisreal</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            I build small, focused tools that solve real problems — PDF utilities, automation scripts, and
            browser-based apps. Everything here is open, free, and runs without tracking your data.
          </p>
          <div className="flex gap-4 mt-6">
            <a
              href="https://github.com/eoftisreal"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
            >
            <Code2 className="w-4 h-4" />
              GitHub
            </a>
            <a
              href="mailto:contact@eoftisreal.github.io"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
            >
              <Mail className="w-4 h-4" />
              Contact
            </a>
          </div>
        </div>

        {/* Projects */}
        <h2 className="text-2xl font-bold mb-6">Projects</h2>
        <div className="space-y-4">
          {projects.map((p) => (
            <a
              key={p.title}
              href={p.href}
              className={`glass-panel rounded-2xl p-6 flex items-start justify-between gap-4 group border border-white/10 transition-colors ${colorBorder[p.color]}`}
            >
              <div>
                <h3 className="font-bold text-lg mb-1 group-hover:text-white transition-colors">{p.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0 mt-1" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
