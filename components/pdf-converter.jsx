
"use client";

import { useRef, useState } from "react";
import {
  FileText, Image as ImageIcon, Upload, X, Download, Loader2,
  Combine, Scissors, RotateCw, Minimize2, GripVertical,
  ArrowUp, ArrowDown, RefreshCw, CheckCircle2, AlertCircle
} from "lucide-react";

const MAX_SIZE = 50 * 1024 * 1024;

const TOOLS = [
  { id: "images", name: "Images to PDF", icon: ImageIcon },
  { id: "merge", name: "Merge PDF", icon: Combine },
  { id: "split", name: "Split / Extract PDF", icon: Scissors },
  { id: "reorder", name: "Reorder PDF", icon: GripVertical },
  { id: "rotate", name: "Rotate PDF", icon: RotateCw },
  { id: "compress", name: "Compress PDF", icon: Minimize2 },
];

const ACCEPTED_IMAGES = [
  "image/jpeg", "image/png", "image/webp", "image/avif"
];

function formatSize(bytes) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function PDFTool() {
  const inputRef = useRef(null);

  const [tool, setTool] = useState("images");
  const [files, setFiles] = useState([]);
  const [pageRange, setPageRange] = useState("");
  const [pageOrder, setPageOrder] = useState("");
  const [rotation, setRotation] = useState("90");
  const [quality, setQuality] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const selectedTool = TOOLS.find(t => t.id === tool);

  function clearMessages() {
    setMessage("");
    setError("");
    setResult(null);
  }

  function changeTool(id) {
    setTool(id);
    setFiles([]);
    clearMessages();
    setPageRange("");
    setPageOrder("");
  }

  function addFiles(fileList) {
    clearMessages();

    const incoming = Array.from(fileList || []);
    const accepted = [];

    for (const file of incoming) {
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      const isImage =
        ACCEPTED_IMAGES.includes(file.type) ||
        /\.(jpg|jpeg|png|webp|avif)$/i.test(file.name);

      if (file.size > MAX_SIZE) {
        setError(`${file.name} exceeds the 50 MB file limit.`);
        continue;
      }

      if (tool === "images" && !isImage) {
        setError("Please select JPG, PNG, WebP or AVIF images.");
        continue;
      }

      if (["split", "reorder", "rotate", "compress"].includes(tool) && !isPdf) {
        setError("This operation accepts PDF files only.");
        continue;
      }

      if (!isPdf && !isImage) {
        setError(`${file.name} is not a supported file.`);
        continue;
      }

      if (["split", "reorder", "rotate", "compress"].includes(tool) && accepted.length > 0) {
        setError("Select only one PDF for this operation.");
        continue;
      }

      accepted.push({
        id: crypto.randomUUID(),
        file
      });
    }

    setFiles(old => [...old, ...accepted]);
  }

  function moveFile(index, direction) {
    setFiles(old => {
      const next = [...old];
      const target = index + direction;

      if (target < 0 || target >= next.length) return old;

      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function processFiles() {
    clearMessages();

    if (!files.length) {
      setError("Please select at least one file.");
      return;
    }

    if (files.some(item => item.file.size > MAX_SIZE)) {
      setError("A file exceeds the 50 MB limit.");
      return;
    }

    if (tool === "merge" && files.length < 2) {
      setError("Select at least two files to merge.");
      return;
    }

    if (tool === "images" && files.some(item => item.file.type === "application/pdf")) {
      setError("Images to PDF accepts image files only.");
      return;
    }

    if (["split", "reorder", "rotate", "compress"].includes(tool) && files.length !== 1) {
      setError("Select exactly one PDF.");
      return;
    }

    if (tool === "split" && !pageRange.trim()) {
      setError("Enter the pages you want to extract.");
      return;
    }

    if (tool === "reorder" && !pageOrder.trim()) {
      setError("Enter the new page sequence.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("operation", tool);
      formData.append("pageRange", pageRange);
      formData.append("pageOrder", pageOrder);
      formData.append("rotation", rotation);
      formData.append("quality", quality);

      files.forEach(item => {
        formData.append("files", item.file);
      });

      const response = await fetch("/api/pdf/process", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "PDF processing failed.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/i);

      setResult({
        url,
        filename: match?.[1] || "converted-document.pdf",
        size: blob.size
      });

      setMessage("Your PDF is ready!");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function downloadFile() {
    if (!result) return;

    const link = document.createElement("a");
    link.href = result.url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function removeFile(id) {
    setFiles(old => old.filter(item => item.id !== id));
    clearMessages();
  }

  const needsSinglePdf = ["split", "reorder", "rotate", "compress"].includes(tool);

  return (
    <main className="min-h-screen bg-[#080d18] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

        <header className="mb-9">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400">
            <FileText size={14} />
            DIGITALTOOL PDF UTILITIES
          </div>

          <h1 className="text-3xl font-bold sm:text-4xl">
            PDF Converter & Compressor
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Convert images, compress PDFs, merge documents and organize pages
            using our document processing tools.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">

          <aside className="h-fit rounded-2xl border border-slate-800 bg-[#101827] p-3">
            <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              PDF Tools
            </p>

            <div className="space-y-1">
              {TOOLS.map(item => {
                const Icon = item.icon;
                const active = tool === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => changeTool(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
                      active
                        ? "bg-blue-500/15 text-blue-400"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="rounded-2xl border border-slate-800 bg-[#101827] p-5 sm:p-7">

            <h2 className="text-xl font-bold">{selectedTool.name}</h2>

            <p className="mt-2 text-sm text-slate-400">
              Upload your files below. Maximum 50 MB per file.
            </p>

            <input
              ref={inputRef}
              type="file"
              multiple={!needsSinglePdf}
              accept={tool === "images"
                ? ".jpg,.jpeg,.png,.webp,.avif"
                : tool === "merge"
                  ? ".pdf,.jpg,.jpeg,.png,.webp,.avif"
                  : ".pdf"
              }
              className="hidden"
              onChange={e => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <button
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="mt-6 flex min-h-48 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-[#0a1220] transition hover:border-blue-500 hover:bg-blue-500/5 disabled:opacity-50"
            >
              <div className="mb-4 rounded-2xl bg-blue-500/15 p-4 text-blue-400">
                <Upload size={28} />
              </div>

              <span className="font-bold">Choose files</span>

              <span className="mt-2 text-xs text-slate-500">
                Click to browse your device
              </span>
            </button>

            {files.length > 0 && (
              <div className="mt-7">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold">
                    Selected files ({files.length})
                  </h3>

                  <button
                    onClick={() => {
                      setFiles([]);
                      clearMessages();
                    }}
                    className="text-xs text-slate-400 hover:text-red-400"
                  >
                    Clear all
                  </button>
                </div>

                <div className="space-y-2">
                  {files.map((item, index) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={e => e.dataTransfer.setData("text/plain", String(index))}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault();
                        const from = Number(e.dataTransfer.getData("text/plain"));

                        if (!Number.isInteger(from) || from === index) return;

                        setFiles(old => {
                          const next = [...old];
                          const [picked] = next.splice(from, 1);
                          next.splice(index, 0, picked);
                          return next;
                        });
                      }}
                      className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0a1220] p-3"
                    >
                      <GripVertical size={17} className="shrink-0 text-slate-600" />

                      <FileText size={19} className="shrink-0 text-blue-400" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{item.file.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatSize(item.file.size)}
                        </p>
                      </div>

                      {!needsSinglePdf && (
                        <>
                          <button
                            onClick={() => moveFile(index, -1)}
                            disabled={index === 0}
                            className="text-slate-400 disabled:opacity-20"
                            title="Move up"
                          >
                            <ArrowUp size={16} />
                          </button>

                          <button
                            onClick={() => moveFile(index, 1)}
                            disabled={index === files.length - 1}
                            className="text-slate-400 disabled:opacity-20"
                            title="Move down"
                          >
                            <ArrowDown size={16} />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => removeFile(item.id)}
                        className="text-slate-500 hover:text-red-400"
                        title="Remove file"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>

                {(tool === "merge" || tool === "images") && (
                  <p className="mt-2 text-xs text-slate-500">
                    Drag files or use the arrows to change their order.
                  </p>
                )}
              </div>
            )}

            {tool === "split" && (
              <label className="mt-6 block text-sm font-bold text-slate-300">
                Pages to extract
                <input
                  value={pageRange}
                  onChange={e => setPageRange(e.target.value)}
                  placeholder="Example: 1-3, 5, 8"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-[#080d18] px-4 py-3 text-white outline-none focus:border-blue-500"
                />
                <span className="mt-2 block text-xs font-normal text-slate-500">
                  Enter page numbers and ranges separated by commas.
                </span>
              </label>
            )}

            {tool === "reorder" && (
              <label className="mt-6 block text-sm font-bold text-slate-300">
                New page sequence
                <input
                  value={pageOrder}
                  onChange={e => setPageOrder(e.target.value)}
                  placeholder="Example: 3,1,2,4"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-[#080d18] px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </label>
            )}

            {tool === "rotate" && (
              <label className="mt-6 block text-sm font-bold text-slate-300">
                Rotation angle
                <select
                  value={rotation}
                  onChange={e => setRotation(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-[#080d18] px-4 py-3 text-white outline-none focus:border-blue-500"
                >
                  <option value="90">90° clockwise</option>
                  <option value="180">180°</option>
                  <option value="270">270° clockwise</option>
                </select>
              </label>
            )}

            {tool === "compress" && (
              <label className="mt-6 block text-sm font-bold text-slate-300">
                Compression mode
                <select
                  value={quality}
                  onChange={e => setQuality(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-[#080d18] px-4 py-3 text-white outline-none focus:border-blue-500"
                >
                  <option value="high">High quality</option>
                  <option value="medium">Balanced</option>
                  <option value="low">Smaller file</option>
                </select>
                <span className="mt-2 block text-xs font-normal text-amber-400">
                  Compression currently performs a structural PDF rewrite.
                  Image recompression is not yet implemented.
                </span>
              </label>
            )}

            {error && (
              <div role="alert" className="mt-6 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                <AlertCircle size={18} className="shrink-0" />
                {error}
              </div>
            )}

            {message && (
              <div role="status" className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                <CheckCircle2 size={18} />
                {message}
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={processFiles}
                disabled={loading || !files.length}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading
                  ? <Loader2 size={18} className="animate-spin" />
                  : <RefreshCw size={18} />}
                {loading ? "Processing..." : "Process PDF"}
              </button>

              {result && (
                <button
                  onClick={downloadFile}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                >
                  <Download size={18} />
                  Download PDF
                </button>
              )}
            </div>

            {result && (
              <div className="mt-5 rounded-xl border border-slate-800 bg-[#0a1220] p-4">
                <p className="text-sm font-bold">{result.filename}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Output size: {formatSize(result.size)}
                </p>
              </div>
            )}

            <p className="mt-7 text-xs leading-5 text-slate-500">
               Maximum 50 MB per file.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
