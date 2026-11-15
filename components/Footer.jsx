
import Link from "next/link";
import {
  Sparkles,
  Image as ImageIcon,
  Home,
  ShieldCheck,
  Mail,
  ArrowUpRight,
} from "lucide-react";

const toolLinks = [
  {
    name: "Image Compressor",
    href: "/image-compressor",
    icon: ImageIcon,
  },
];

const usefulLinks = [
  {
    name: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "Privacy Policy",
    href: "/privacy-policy",
    icon: ShieldCheck,
  },
  {
    name: "Contact",
    href: "/contact",
    icon: Mail,
  },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-slate-950">

      {/* Background glow */}
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-64 w-64 rounded-full bg-blue-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-violet-600/10 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-14 sm:px-6 lg:px-8">

        {/* Main Footer */}
        <div className="grid grid-cols-1 gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20">
                <Sparkles size={22} className="text-white" />
              </div>

              <span className="text-2xl font-bold tracking-tight text-white">
                Digital<span className="text-blue-400">Tool</span>
              </span>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              Powerful and easy-to-use online tools designed to simplify
              everyday digital tasks. Get things done with less effort.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Simple tools. Better productivity.
            </div>
          </div>

          {/* Tools */}
          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">
              Our Tools
            </h3>

            <ul className="space-y-4">
              {toolLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-blue-400"
                    >
                      <Icon size={16} />
                      {link.name}
                      <ArrowUpRight
                        size={13}
                        className="opacity-0 transition group-hover:opacity-100"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">
              Useful Links
            </h3>

            <ul className="space-y-4">
              {usefulLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-blue-400"
                    >
                      <Icon size={16} />
                      {link.name}
                      <ArrowUpRight
                        size={13}
                        className="opacity-0 transition group-hover:opacity-100"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} DigitalTool. All rights reserved.
          </p>

          <p className="text-xs text-slate-500">
            Built to make digital tasks simpler.
          </p>
        </div>
      </div>
    </footer>
  );
}
