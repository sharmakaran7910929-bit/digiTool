
import Link from "next/link";
import {
  Image as ImageIcon,
  Images,
  FileImage,
  FileDown,
  Layers,
  Zap,
  Gauge,
  Maximize2,
  Minimize2,
  Ruler,
  Target,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  ImagePlus,
} from "lucide-react";

export const metadata = {
  title: "Image Compressor Tools | DigitalTool",
  description:
    "Explore free online image compression tools. Compress JPG, JPEG, PNG and WebP images, reduce image sizes to specific KB targets and resize images.",
};

const iconMap = {
  image: ImageIcon,
  images: Images,
  file: FileImage,
  download: FileDown,
  layers: Layers,
  zap: Zap,
  gauge: Gauge,
  resize: Maximize2,
  minimize: Minimize2,
  ruler: Ruler,
  target: Target,
  shield: ShieldCheck,
  plus: ImagePlus,
};

const toolGroups = [
  {
    title: "Popular Image Compression Tools",
    description: "Quick access to commonly used image compression tools.",
    icon: "zap",
    tools: [
      {
        name: "Image Compressor",
        slug: "image-compressor",
        description: "Compress images with adjustable quality and output settings.",
        icon: "image",
        featured: true,
      },
      {
        name: "Compress Image Online",
        slug: "compress-image-online",
        description: "Reduce image file size directly online.",
        icon: "download",
      },
      {
        name: "Compress Image Free Online",
        slug: "compress-image-free-online",
        description: "Compress images using a free online tool.",
        icon: "file",
      },
      {
        name: "Bulk Image Compressor",
        slug: "bulk-image-compressor",
        description: "Compress multiple images in one workflow.",
        icon: "layers",
      },
      {
        name: "Photo Compressor",
        slug: "photo-compressor",
        description: "Reduce the file size of digital photographs.",
        icon: "images",
      },
      {
        name: "JPG Compressor",
        slug: "jpg-compressor",
        description: "Reduce the file size of JPG images.",
        icon: "image",
      },
      {
        name: "PNG Compressor",
        slug: "png-compressor",
        description: "Optimize PNG images and reduce their size.",
        icon: "file",
      },
      {
        name: "WebP Compressor",
        slug: "webp-compressor",
        description: "Compress WebP images for smaller file sizes.",
        icon: "gauge",
      },
    ],
  },
  {
    title: "Compress Images to Specific Sizes",
    description: "Find tools for reducing images to a particular file size.",
    icon: "target",
    tools: [
      {
        name: "Compress Image to 10KB",
        slug: "compress-image-to-10kb",
        icon: "target",
      },
      {
        name: "Compress Image to 15KB",
        slug: "compress-image-to-15kb",
        icon: "target",
      },
      {
        name: "Compress Image to 20KB",
        slug: "compress-image-to-20kb",
        icon: "target",
      },
      {
        name: "Compress Image to 30KB",
        slug: "compress-image-to-30kb",
        icon: "target",
      },
      {
        name: "Compress Image to 40KB",
        slug: "compress-image-to-40kb",
        icon: "target",
      },
      {
        name: "Compress Image to 50KB",
        slug: "compress-image-to-50kb",
        icon: "target",
      },
      {
        name: "Compress Image to 50KB Online",
        slug: "compress-image-to-50kb-online",
        icon: "target",
      },
      {
        name: "Compress Image to 80KB",
        slug: "compress-image-to-80kb",
        icon: "target",
      },
      {
        name: "Compress Image to 100KB",
        slug: "compress-image-to-100kb",
        icon: "target",
      },
      {
        name: "Compress Image to 100KB Online",
        slug: "compress-image-to-100kb-online",
        icon: "target",
      },
      {
        name: "Compress Image Under 100KB",
        slug: "compress-image-under-100kb",
        icon: "minimize",
      },
      {
        name: "Compress Image to 150KB",
        slug: "compress-image-to-150kb",
        icon: "target",
      },
      {
        name: "Compress Image to 200KB",
        slug: "compress-image-to-200kb",
        icon: "target",
      },
      {
        name: "Compress Image to 300KB",
        slug: "compress-image-to-300kb",
        icon: "target",
      },
      {
        name: "Compress Image to 400KB",
        slug: "compress-image-to-400kb",
        icon: "target",
      },
      {
        name: "Compress Image to 500KB",
        slug: "compress-image-to-500kb",
        icon: "target",
      },
      {
        name: "Compress Image to 1MB",
        slug: "compress-image-to-1mb",
        icon: "target",
      },
      {
        name: "Compress Image to 2MB",
        slug: "compress-image-to-2mb",
        icon: "target",
      },
    ],
  },
  {
    title: "JPG and JPEG Compression",
    description: "Dedicated tools for compressing JPEG and JPG images.",
    icon: "image",
    tools: [
      {
        name: "Compress JPEG Online",
        slug: "compress-jpeg-online",
        icon: "file",
      },
      {
        name: "Compress JPEG to 50KB",
        slug: "compress-jpeg-to-50kb",
        icon: "target",
      },
      {
        name: "Compress JPEG to 100KB",
        slug: "compress-jpeg-to-100kb",
        icon: "target",
      },
      {
        name: "Compress JPEG to 500KB",
        slug: "compress-jpeg-to-500kb",
        icon: "target",
      },
      {
        name: "Compress JPG to 20KB",
        slug: "compress-jpg-to-20kb",
        icon: "target",
      },
      {
        name: "Compress JPG to 50KB",
        slug: "compress-jpg-to-50kb",
        icon: "target",
      },
      {
        name: "Compress JPG to 100KB",
        slug: "compress-jpg-to-100kb",
        icon: "target",
      },
      {
        name: "Compress JPG to 200KB",
        slug: "compress-jpg-to-200kb",
        icon: "target",
      },
      {
        name: "Compress JPG to 1MB",
        slug: "compress-jpg-to-1mb",
        icon: "target",
      },
      {
        name: "Reduce JPG File Size",
        slug: "reduce-jpg-file-size",
        icon: "minimize",
      },
    ],
  },
  {
    title: "PNG Compression",
    description: "Tools specifically designed for reducing PNG image sizes.",
    icon: "file",
    tools: [
      {
        name: "Compress PNG Online",
        slug: "compress-png-online",
        icon: "file",
      },
      {
        name: "Compress PNG to 50KB",
        slug: "compress-png-to-50kb",
        icon: "target",
      },
      {
        name: "Compress PNG to 100KB",
        slug: "compress-png-to-100kb",
        icon: "target",
      },
      {
        name: "Reduce PNG File Size",
        slug: "reduce-png-file-size",
        icon: "minimize",
      },
    ],
  },
  {
    title: "Image Resizing and Size Reduction",
    description: "Adjust image dimensions, resolution and overall file size.",
    icon: "resize",
    tools: [
      {
        name: "Image Resizer",
        slug: "image-resizer",
        icon: "resize",
      },
      {
        name: "Image Size Reducer",
        slug: "image-size-reducer",
        icon: "minimize",
      },
      {
        name: "Reduce Image Size",
        slug: "reduce-image-size",
        icon: "minimize",
      },
      {
        name: "Reduce Image Size in KB",
        slug: "reduce-image-size-in-kb",
        icon: "target",
      },
      {
        name: "Reduce Image Size in MB",
        slug: "reduce-image-size-in-mb",
        icon: "target",
      },
      {
        name: "Reduce Image Dimensions",
        slug: "reduce-image-dimensions",
        icon: "ruler",
      },
      {
        name: "Reduce Image Pixel Size",
        slug: "reduce-image-pixel-size",
        icon: "resize",
      },
      {
        name: "Reduce Image Resolution",
        slug: "reduce-image-resolution",
        icon: "gauge",
      },
    ],
  },
  {
    title: "Image Quality and Optimization",
    description: "Choose the right balance between image quality and file size.",
    icon: "gauge",
    tools: [
      {
        name: "Reduce Image Quality",
        slug: "reduce-image-quality",
        icon: "gauge",
      },
      {
        name: "Compress Image Without Losing Quality",
        slug: "compress-image-without-losing-quality",
        icon: "shield",
      },
    ],
  },
];

function ToolCard({ tool }) {
  const Icon = iconMap[tool.icon] || ImageIcon;

  return (
    <Link
      href={`/image-compressor/${tool.slug}`}
      className="group relative flex min-h-[116px] items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/40 hover:bg-blue-500/[0.07] hover:shadow-xl hover:shadow-blue-950/30 sm:p-5"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-blue-300 transition-all group-hover:border-blue-400/40 group-hover:from-blue-500/30 group-hover:to-violet-500/30">
        <Icon size={21} strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="pr-4 text-sm font-bold leading-6 text-white transition-colors group-hover:text-blue-300">
          {tool.name}
        </h3>

        {tool.description && (
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {tool.description}
          </p>
        )}
      </div>

      <ArrowUpRight
        size={17}
        className="absolute right-4 top-4 text-slate-500 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-300"
      />
    </Link>
  );
}

export default function MainCompressorPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">

      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-80 h-[420px] w-[420px] rounded-full bg-violet-600/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8">

        {/* Hero */}
        <section className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300">
            <Sparkles size={15} />
            IMAGE TOOLS COLLECTION
          </div>

          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Image Compressor{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              Tools
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            Compress images, reduce file sizes, resize dimensions and optimize
            JPG, JPEG, PNG and WebP images with our collection of online tools.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/image-compressor/image-compressor"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/40 transition hover:-translate-y-0.5 hover:shadow-blue-900/40"
            >
              <ImageIcon size={18} />
              Open Image Compressor
              <ArrowRight size={17} />
            </Link>
          </div>

          {/* Quick benefits */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              Easy to use
            </span>
            <span className="flex items-center gap-2">
              <Zap size={16} className="text-blue-400" />
              Multiple tools
            </span>
            <span className="flex items-center gap-2">
              <ImageIcon size={16} className="text-violet-400" />
              Multiple image formats
            </span>
          </div>
        </section>

        {/* Tool Groups */}
        <div className="mt-20 space-y-16">
          {toolGroups.map((group, index) => {
            const GroupIcon = iconMap[group.icon] || ImageIcon;

            return (
              <section key={group.title} id={`tool-group-${index}`}>
                <div className="mb-7 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-300">
                    <GroupIcon size={21} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-white sm:text-2xl">
                      {group.title}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {group.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.tools.map((tool) => (
                    <ToolCard key={tool.slug} tool={tool} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <section className="mt-20 overflow-hidden rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-600/15 via-slate-900 to-violet-600/15 p-8 text-center sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/15 text-blue-300">
            <ImagePlus size={27} />
          </div>

          <h2 className="mt-5 text-2xl font-bold text-white sm:text-3xl">
            Ready to Compress Your Images?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">
            Start with our main image compressor and explore the available
            compression settings and output options.
          </p>

          <Link
            href="/image-compressor/image-compressor"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            Start Compressing
            <ArrowRight size={17} />
          </Link>
        </section>

      </div>
    </main>
  );
}
