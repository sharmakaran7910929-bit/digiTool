"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Image as ImageIcon,
  ArrowRight,
  Zap,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  LockKeyhole,
  FileText,
  Menu,
  X,
  ChevronRight,
  Command,
  ScanSearch,
  Clock3,
  Heart,
  Files,
  FileImage,
  FileOutput,
  Layers,
} from "lucide-react";

const tools = [
  {
    name: "Image Tools",
    description:
      "Compress, resize, and convert JPG, PNG, WebP, AVIF, and other image formats in one place.",
    category: "Images",
    icon: ImageIcon,
    href: "/image-compressor",
    status: "available",
    tag: "3 Tools in 1",
  },
  
];

const categories = ["All Tools", "Images", "PDF"];

const benefits = [
  {
    icon: Zap,
    title: "Fast Processing",
    description: "Get your files processed without unnecessary steps.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy Focused",
    description: "Your files are processed using our own tools and systems.",
  },
  {
    icon: LockKeyhole,
    title: "No Account Needed",
    description: "Access available tools without creating an account.",
  },
  {
    icon: Heart,
    title: "Easy to Use",
    description: "Simple interfaces that make everyday tasks easier.",
  },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Tools");
  const [mobileMenu, setMobileMenu] = useState(false);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesCategory =
        category === "All Tools" || tool.category === category;

      const matchesSearch =
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.description.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  const scrollToTools = () => {
    document.getElementById("tools")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#080d1c] text-white selection:bg-blue-500/30">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute -right-40 top-[400px] h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[130px]" />
      </div>

      {/* HERO */}
      <section className="relative z-10 px-5 pb-20 pt-20 md:pb-28 md:pt-28">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/[0.08] px-4 py-2 text-xs font-semibold text-blue-300"
          >
            <Sparkles size={14} />
            A smarter way to get things done
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px]">
              DIGITAL TOOLS
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-4xl font-bold leading-[1.15] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Powerful tools.
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Simpler solutions.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-400 md:text-lg"
          >
            Compress images, manage PDF documents, and complete everyday
            digital tasks with practical online tools designed to save time
            and simplify your work.
          </motion.p>

          {/* SEARCH */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto mt-10 max-w-2xl"
          >
            <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-2 shadow-2xl shadow-black/20 transition focus-within:border-blue-400/60 focus-within:bg-white/[0.09]">
              <Search className="ml-3 shrink-0 text-slate-400" size={21} />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (e.target.value) scrollToTools();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") scrollToTools();
                }}
                placeholder="What do you want to do today?"
                className="h-12 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500 md:text-base"
              />
              <button
                onClick={scrollToTools}
                className="hidden rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold transition hover:bg-blue-500 sm:block"
              >
                Find Tools
              </button>
              <button
                onClick={scrollToTools}
                className="rounded-xl bg-blue-600 p-3 sm:hidden"
                aria-label="Search tools"
              >
                <ArrowRight size={18} />
              </button>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Try searching: image tools, compress PDF, merge PDF
            </p>
          </motion.div>

          {/* QUICK BENEFITS */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-medium text-slate-400"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400" />
              No registration
            </span>
            <span className="flex items-center gap-2">
              <Zap size={15} className="text-yellow-400" />
              Easy to use
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-blue-400" />
              Privacy focused
            </span>
          </motion.div>
        </div>

        {/* HERO WORKSPACE */}
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative mx-auto mt-20 max-w-4xl"
        >
          <div className="absolute -inset-8 rounded-[40px] bg-gradient-to-r from-blue-600/15 to-purple-600/15 blur-3xl" />

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#101a30] p-5 shadow-2xl shadow-black/40 md:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-white/[0.08] pb-5">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
              <span className="text-xs font-medium text-slate-500">
                DigitalTool Workspace
              </span>
              <Sparkles size={17} className="text-blue-400" />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Link
                href="/image-compressor"
                className="group flex min-h-[240px] flex-col justify-center rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/[0.03] p-7 transition hover:border-blue-400/40"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
                  <ImageIcon size={30} />
                </div>
                <h3 className="text-xl font-bold">Image Tools</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Compress, resize, and convert images using one convenient tool.
                </p>
                <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold transition group-hover:bg-blue-500">
                  Explore Image Tools <ArrowRight size={16} />
                </span>
              </Link>

             
            </div>
          </div>
        </motion.div>
      </section>

      {/* TOOL LIBRARY */}
      <section id="tools" className="relative z-10 scroll-mt-20 px-5 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-blue-400">
                <Command size={17} /> TOOL LIBRARY
              </div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Explore Our Tools
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
                Practical tools for images, documents, and everyday digital
                tasks. Each tool brings related features together in one place.
              </p>
            </div>

            <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-400">
              {tools.filter((t) => t.status === "available").length} available
            </span>
          </div>

          {/* CATEGORY FILTER */}
          <div className="mb-8 flex flex-wrap gap-3">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                  category === item
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "border border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* TOOL GRID */}
          <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredTools.map((tool) => (
                <motion.div
                  key={tool.name}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="group relative flex min-h-[255px] flex-col rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/[0.06]"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition group-hover:bg-blue-500/20">
                      <tool.icon size={24} />
                    </div>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold text-emerald-400">
                      AVAILABLE
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-lg font-bold">{tool.name}</h3>
                      {tool.tag && (
                        <span className="rounded-md bg-blue-500/15 px-2 py-1 text-[9px] font-bold text-blue-300">
                          {tool.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-6 text-slate-400">
                      {tool.description}
                    </p>
                  </div>

                  <Link
                    href={tool.href}
                    className="mt-7 flex items-center justify-between border-t border-white/[0.07] pt-5 text-sm font-bold text-blue-400 transition hover:text-blue-300"
                  >
                    Open Tool <ArrowRight size={17} />
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredTools.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-16 text-center">
              <ScanSearch className="mx-auto mb-4 text-slate-500" size={35} />
              <h3 className="text-lg font-bold">No tools found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try a different keyword or category.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All Tools");
                }}
                className="mt-5 text-sm font-bold text-blue-400"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="relative z-10 border-y border-white/[0.06] bg-white/[0.015] px-5 py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="text-sm font-bold text-blue-400">
              WHY DIGITALTOOL
            </span>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Useful tools. No unnecessary complexity.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Everyday digital tasks should be simple, accessible, and
              straightforward.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-white/[0.07] bg-[#101a30]/70 p-6 transition hover:border-blue-400/30"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <benefit.icon size={24} />
                </div>
                <h3 className="font-bold">{benefit.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="relative z-10 px-5 py-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 px-6 py-16 text-center md:px-12">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-[80px]" />
          <div className="relative">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/15 text-blue-300">
              <Sparkles size={27} />
            </div>
            <h2 className="text-3xl font-bold md:text-5xl">
              Make your next task easier.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-400 md:text-base">
              From image editing to PDF management, discover practical tools
              that help you get more done with less effort.
            </p>
            <Link
              href="/image-compressor"
              className="mt-9 inline-flex items-center gap-3 rounded-xl bg-blue-600 px-7 py-4 text-sm font-bold shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 hover:bg-blue-500"
            >
              Explore Image Tools <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
