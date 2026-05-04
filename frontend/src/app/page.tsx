import Link from "next/link";
import { RotateCw, FileText, Link2, User } from "lucide-react";

const tools = [
  {
    href: "/tools/pdf-rotator",
    icon: <RotateCw className="w-7 h-7" />,
    color: "orange",
    title: "PDF Rotator",
    desc: "Rotate pages in any PDF file — client-side, no uploads required.",
    label: "Open Tool",
  },
  {
    href: "/tools/pdf-analyzer",
    icon: <FileText className="w-7 h-7" />,
    color: "blue",
    title: "PDF Analyzer",
    desc: "Merge, split, compress, and inspect PDF documents securely in your browser.",
    label: "Open Tool",
  },
  {
    href: "/tools/link-resolver",
    icon: <Link2 className="w-7 h-7" />,
    color: "green",
    title: "Link Resolver Pro",
    desc: "Cloud notebook for automated multi-threaded link resolution and bypass. Run directly in Google Colab.",
    label: "Open Notebook",
  },
  {
    href: "/about",
    icon: <User className="w-7 h-7" />,
    color: "purple",
    title: "Portfolio",
    desc: "About me — projects, skills, and contact.",
    label: "View Portfolio",
  },
];

const colorMap: Record<string, string> = {
  orange: "bg-orange-500/20 text-orange-400 hover:border-orange-500/50 group-hover:bg-orange-500",
  blue:   "bg-blue-500/20 text-blue-400 hover:border-blue-500/50 group-hover:bg-blue-500",
  green:  "bg-green-500/20 text-green-400 hover:border-green-500/50 group-hover:bg-green-500",
  purple: "bg-purple-500/20 text-purple-400 hover:border-purple-500/50 group-hover:bg-purple-500",
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-32">
      <div className="max-w-3xl w-full mx-auto text-center mb-14">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4">
          My <span className="text-gradient">Tools</span>
        </h1>
        <p className="text-slate-400 text-lg">
          A personal portal. Pick a tool and get started.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 max-w-3xl w-full mx-auto">
        {tools.map((tool) => {
          const colors = colorMap[tool.color];
          const [iconBg, , borderHover, btnHover] = colors.split(" ");
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className={`glass-panel p-8 rounded-3xl group flex flex-col h-full border border-white/10 transition-all ${borderHover}`}
            >
              <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center mb-6 ${colors.split(" ")[1]}`}>
                {tool.icon}
              </div>
              <h2 className="text-xl font-bold mb-2">{tool.title}</h2>
              <p className="text-sm text-slate-400 mb-6 flex-grow leading-relaxed">{tool.desc}</p>
              <span className={`inline-block text-center w-full py-2.5 rounded-xl bg-white/5 text-sm font-medium transition-colors ${btnHover} group-hover:text-white`}>
                {tool.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

