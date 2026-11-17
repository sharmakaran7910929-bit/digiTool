
export default function AdSlot() {
  return (
    <div className="group relative flex min-h-[600px] w-full items-center justify-center overflow-hidden rounded-xl border border-blue-400/20 bg-[#080e20]">

      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-cyan-500/20 animate-gradient" />

      {/* Colorful Glow */}
      <div className="absolute -left-16 top-20 h-48 w-48 rounded-full bg-blue-500/20 blur-[90px] animate-pulse" />

      <div className="absolute -right-16 bottom-20 h-48 w-48 rounded-full bg-purple-500/20 blur-[90px] animate-pulse" />

      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-400/[0.04] to-transparent" />

      {/* Content */}
      <div className="relative z-10 text-center">
        <div className="mb-3 text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-300">
          AD SPACE
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
          Advertisement
        </p>

        <div className="mx-auto mt-5 h-[2px] w-16 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400" />
      </div>

    </div>
  );
}
