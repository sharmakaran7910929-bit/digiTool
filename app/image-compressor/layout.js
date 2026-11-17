
import AdSlot from "@/components/AdSlot";

export default function ToolLayout({ children }) {
  return (
    <div className="w-full">

      {/* Mobile / Tablet Top Ad */}
      <div className="mb-5 lg:hidden px-3">
        <AdSlot />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(250px,1fr)_minmax(0,1100px)_minmax(250px,1fr)] gap-5">

        {/* Desktop Left Ad */}
        <aside className="hidden lg:block">
          <div className="sticky top-5 w-full">
            <AdSlot />
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 w-full">
          {children}
        </main>

        {/* Desktop Right Ad */}
        <aside className="hidden lg:block">
          <div className="sticky top-5 w-full">
            <AdSlot />
          </div>
        </aside>

      </div>

      {/* Mobile / Tablet Bottom Ad */}
      <div className="mt-5 lg:hidden px-3">
        <AdSlot />
      </div>

    </div>
  );
}
