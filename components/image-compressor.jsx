
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  FileImage,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
  Zap,
  Maximize2,
} from "lucide-react";

const presets = [
  {
    name: "Balanced",
    quality: 75,
    description: "Great balance of size and quality",
  },
  {
    name: "High Quality",
    quality: 90,
    description: "Keep more image detail",
  },
  {
    name: "Maximum",
    quality: 55,
    description: "Smaller files, faster sharing",
  },
];

const formats = ["Original", "WebP", "JPEG", "PNG", "AVIF"];

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_TARGET_SIZE = 100 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

function formatBytes(bytes = 0) {
  if (!Number.isFinite(Number(bytes)) || Number(bytes) <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  return `${(bytes / 1024 ** index).toFixed(
    index === 0 ? 0 : 2
  )} ${units[index]}`;
}

function getOutputName(fileName, outputFormat) {
  const baseName = fileName.replace(/\.[^.]+$/, "");
  const extension = outputFormat === "jpeg" ? "jpg" : outputFormat;

  return `${baseName}-compressed.${extension}`;
}

function ErrorAlert({ title, message, onClose }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-rose-200"
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
        <X size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-rose-300">{title}</p>
        <p className="mt-1 break-words text-xs leading-6 text-rose-200/80">
          {message}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss error"
        title="Dismiss error"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-rose-300 transition hover:bg-rose-500/20 hover:text-white"
      >
        <X size={18} />
      </button>
    </div>
  );
}

export default function ImageCompressor() {
  const [files, setFiles] = useState([]);
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState("WebP");
  const [preset, setPreset] = useState("Balanced");

  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [keepRatio, setKeepRatio] = useState(true);

  // Custom maximum output size
  const [targetSize, setTargetSize] = useState("");
  const [targetSizeUnit, setTargetSizeUnit] = useState("KB");

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [processing, setProcessing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);

  const [batchError, setBatchError] = useState("");
  const [uploadError, setUploadError] = useState("");

  const fileInput = useRef(null);
  const urls = useRef([]);

  useEffect(() => {
    return () => {
      urls.current.forEach((url) => URL.revokeObjectURL(url));
      urls.current = [];
    };
  }, []);

  const selectedFile = useMemo(
    () => files.find((item) => item.id === selectedId) || files[0] || null,
    [files, selectedId]
  );

  const totalSize = useMemo(
    () => files.reduce((sum, item) => sum + item.file.size, 0),
    [files]
  );

  const successfulFiles = files.filter(
    (item) => item.status === "success"
  );

  const failedFiles = files.filter(
    (item) => item.status === "error"
  );

  const allCompressed =
    files.length > 0 &&
    files.every((item) => item.status === "success");

  const totalOriginalSize = successfulFiles.reduce(
    (sum, item) => sum + (item.result?.originalSize || 0),
    0
  );

  const totalCompressedSize = successfulFiles.reduce(
    (sum, item) => sum + (item.result?.outputSize || 0),
    0
  );

  const totalSavings =
    totalOriginalSize > 0
      ? Math.max(
          0,
          Math.round(
            ((totalOriginalSize - totalCompressedSize) /
              totalOriginalSize) *
              100
          )
        )
      : 0;

  // --------------------------------------------------
  // FILE URL MANAGEMENT
  // --------------------------------------------------

  const createTrackedUrl = (blob) => {
    const url = URL.createObjectURL(blob);
    urls.current.push(url);
    return url;
  };

  const revokeTrackedUrl = (url) => {
    if (!url) return;

    URL.revokeObjectURL(url);
    urls.current = urls.current.filter((item) => item !== url);
  };

  // --------------------------------------------------
  // UPLOAD VALIDATION
  // --------------------------------------------------

  const addFiles = (fileList) => {
    if (processing) return;

    const selectedFiles = Array.from(fileList || []);

    if (!selectedFiles.length) return;

    setUploadError("");
    setBatchError("");

    const validFiles = [];
    const rejectedFiles = [];

    selectedFiles.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        rejectedFiles.push(
          `${file.name}: Unsupported file format.`
        );
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        rejectedFiles.push(
          `${file.name}: File exceeds the 20 MB limit.`
        );
        return;
      }

      if (file.size === 0) {
        rejectedFiles.push(
          `${file.name}: This file is empty.`
        );
        return;
      }

      validFiles.push(file);
    });

    if (rejectedFiles.length) {
      const displayedErrors = rejectedFiles.slice(0, 3).join(" ");

      const remaining =
        rejectedFiles.length > 3
          ? ` And ${rejectedFiles.length - 3} more file(s) were rejected.`
          : "";

      setUploadError(displayedErrors + remaining);
    }

    if (!validFiles.length) {
      if (!rejectedFiles.length) {
        setUploadError("No valid images were selected.");
      }
      return;
    }

    const newItems = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: createTrackedUrl(file),
      status: "pending",
      result: null,
      error: null,
    }));

    setFiles((current) => [...current, ...newItems]);

    setSelectedId((current) => current || newItems[0].id);
  };

  // --------------------------------------------------
  // REMOVE FILES
  // --------------------------------------------------

  const removeFile = (id) => {
    if (processing) return;

    const item = files.find((file) => file.id === id);

    if (item?.url) {
      revokeTrackedUrl(item.url);
    }

    if (item?.result?.url) {
      revokeTrackedUrl(item.result.url);
    }

    const remaining = files.filter((file) => file.id !== id);

    setFiles(remaining);

    if (selectedId === id) {
      setSelectedId(remaining[0]?.id || null);
    }

    setBatchError("");
  };

  const clearFiles = () => {
    if (processing) return;

    files.forEach((item) => {
      revokeTrackedUrl(item.url);
      revokeTrackedUrl(item.result?.url);
    });

    setFiles([]);
    setSelectedId(null);

    setUploadError("");
    setBatchError("");

    setCompletedCount(0);
    setTotalToProcess(0);
  };

  // --------------------------------------------------
  // ERROR DISMISSAL
  // --------------------------------------------------

  const dismissFileError = (id) => {
    setFiles((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "pending",
              error: null,
            }
          : item
      )
    );
  };

  // --------------------------------------------------
  // PRESETS
  // --------------------------------------------------

  const applyPreset = (selectedPreset) => {
    const found = presets.find(
      (item) => item.name === selectedPreset
    );

    if (!found) return;

    setPreset(found.name);
    setQuality(found.quality);
  };

  // --------------------------------------------------
  // COMPRESSION ENGINE
  // --------------------------------------------------

  const compressImages = async () => {
    if (!files.length || processing) return;

    const queue = files.filter(
      (item) => item.status !== "success"
    );

    if (!queue.length) return;

    if (
      (width.trim() &&
        (!Number.isFinite(Number(width)) ||
          Number(width) <= 0 ||
          Number(width) > 8000)) ||
      (height.trim() &&
        (!Number.isFinite(Number(height)) ||
          Number(height) <= 0 ||
          Number(height) > 8000))
    ) {
      setBatchError(
        "Width and height must be between 1 and 8000 pixels."
      );
      return;
    }

    // Validate custom maximum output size
    let targetSizeBytes = null;

    if (targetSize.trim()) {
      const numericTarget = Number(targetSize);

      const multiplier =
        targetSizeUnit === "MB"
          ? 1024 * 1024
          : 1024;

      targetSizeBytes = Math.round(
        numericTarget * multiplier
      );

      if (
        !Number.isFinite(numericTarget) ||
        numericTarget <= 0 ||
        !Number.isSafeInteger(targetSizeBytes) ||
        targetSizeBytes > MAX_TARGET_SIZE ||
        targetSizeBytes < 1
      ) {
        setBatchError(
          "Enter a valid target size greater than 0 and up to 100 MB."
        );
        return;
      }
    }

    setProcessing(true);
    setBatchError("");
    setCompletedCount(0);
    setTotalToProcess(queue.length);

    let completed = 0;

    try {
      for (const item of queue) {

        // Ensure target size does not exceed this image's original size
if (
  targetSizeBytes !== null &&
  targetSizeBytes > item.file.size
) {
  throw new Error(
    `Target size (${formatBytes(targetSizeBytes)}) cannot be greater than this image's original size (${formatBytes(item.file.size)}).`
  );
}
        setFiles((current) =>
          current.map((file) =>
            file.id === item.id
              ? {
                  ...file,
                  status: "processing",
                  error: null,
                }
              : file
          )
        );

        try {
          const formData = new FormData();

          formData.append("file", item.file);
          formData.append("quality", String(quality));
          formData.append("format", format.toLowerCase());
          formData.append("keepRatio", String(keepRatio));

          if (width.trim()) {
            formData.append("width", width);
          }

          if (height.trim()) {
            formData.append("height", height);
          }

          formData.append("progressive", "false");

          // Apply the same target size to every image
          if (targetSizeBytes !== null) {
            formData.append(
              "targetSizeBytes",
              String(targetSizeBytes)
            );
          }

          const response = await fetch("/api/compress", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            let message = "Compression failed. Please try again.";

            try {
              const data = await response.json();

              message =
                data?.error?.message ||
                data?.error ||
                data?.message ||
                message;
            } catch {
              // Use fallback message if response isn't JSON.
            }

            throw new Error(
              typeof message === "string"
                ? message
                : "The server could not compress this image."
            );
          }

          const blob = await response.blob();

          if (!blob.size) {
            throw new Error(
              "The server returned an empty image. Please try again."
            );
          }

          const previewUrl = createTrackedUrl(blob);

          const originalSize = Number(
            response.headers.get("X-Original-Size") ||
              item.file.size
          );

          const outputSize = Number(
            response.headers.get("X-Output-Size") ||
              blob.size
          );

          const savingsHeader = response.headers.get(
            "X-Savings-Percent"
          );

          const savings =
            savingsHeader !== null
              ? Number(savingsHeader)
              : originalSize > 0
                ? Math.round(
                    ((originalSize - outputSize) / originalSize) *
                      100
                  )
                : 0;

          const outputWidth = Number(
            response.headers.get("X-Output-Width") || 0
          );

          const outputHeight = Number(
            response.headers.get("X-Output-Height") || 0
          );

          const outputFormat =
            response.headers.get("X-Output-Format") ||
            format.toLowerCase();

          const result = {
            blob,
            url: previewUrl,
            originalSize,
            outputSize,
            savings: Math.max(0, savings),
            width: outputWidth,
            height: outputHeight,
            format: outputFormat,
            name: getOutputName(item.file.name, outputFormat),
          };

          setFiles((current) =>
            current.map((file) =>
              file.id === item.id
                ? {
                    ...file,
                    status: "success",
                    result,
                    error: null,
                  }
                : file
            )
          );
        } catch (error) {
          setFiles((current) =>
            current.map((file) =>
              file.id === item.id
                ? {
                    ...file,
                    status: "error",
                    error:
                      error.message ||
                      "Something went wrong while compressing this image.",
                  }
                : file
            )
          );
        }

        completed += 1;
        setCompletedCount(completed);
      }
    } catch (error) {
      setBatchError(
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  // --------------------------------------------------
  // DOWNLOADS
  // --------------------------------------------------

  const downloadResult = (item) => {
    if (!item?.result?.blob) return;

    const downloadUrl = URL.createObjectURL(item.result.blob);

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = item.result.name;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 1000);
  };

  const downloadAll = () => {
    successfulFiles.forEach((item, index) => {
      window.setTimeout(() => {
        downloadResult(item);
      }, index * 350);
    });
  };

  // --------------------------------------------------
  // DRAG AND DROP
  // --------------------------------------------------

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);

    if (!processing) {
      addFiles(event.dataTransfer.files);
    }
  };

  const progress =
    totalToProcess > 0
      ? Math.round(
          (completedCount / totalToProcess) * 100
        )
      : 0;

  return (
    <main className="min-h-screen overflow-hidden bg-[#080d1c] text-white selection:bg-blue-500/30">

      <style jsx global>{`
        @keyframes compressor-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes compressor-shimmer {
          0% { transform: translateX(-150%) skewX(-18deg); }
          100% { transform: translateX(350%) skewX(-18deg); }
        }

        @keyframes compressor-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .compressor-gradient {
          background-size: 220% 220%;
          animation: compressor-gradient 5s ease infinite;
        }

        .compressor-shimmer {
          animation: compressor-shimmer 3.5s ease-in-out infinite;
        }

        .compressor-float {
          animation: compressor-float 4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .compressor-gradient,
          .compressor-shimmer,
          .compressor-float {
            animation: none !important;
          }
        }
      `}</style>

      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute -right-40 top-[500px] h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[130px]" />
      </div>


      {/* COMPRESSOR WORKSPACE */}
      <section
        id="compressor"
        className="relative z-10 scroll-mt-8 px-5 py-16 sm:px-8 sm:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <ImageStudioHeading />

          <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
            {/* LEFT WORKSPACE */}
            <div className="min-w-0 space-y-6">
              {/* UPLOAD CARD */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#101a30] p-5 shadow-xl shadow-black/10 sm:p-7">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Upload images
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Select one or multiple images to get started.
                    </p>
                  </div>

                  {files.length > 0 && (
                    <button
                      type="button"
                      onClick={clearFiles}
                      disabled={processing}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-rose-400 transition hover:bg-rose-500/10 disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                      Clear all
                    </button>
                  )}
                </div>

                {uploadError && (
                  <div className="mb-5">
                    <ErrorAlert
                      title="Upload issue"
                      message={uploadError}
                      onClose={() => setUploadError("")}
                    />
                  </div>
                )}

                {/* DROP ZONE */}
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (!processing) setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  disabled={processing}
                  className={`group flex min-h-56 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-9 text-center transition ${
                    dragging
                      ? "border-blue-400 bg-blue-500/15"
                      : "border-slate-600 bg-[#172642]/60 hover:border-blue-400 hover:bg-blue-500/[0.06]"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-400 shadow-lg shadow-blue-950/20 transition group-hover:-translate-y-1 group-hover:bg-blue-500/20">
                    <Upload size={27} />
                  </div>

                  <span className="text-lg font-bold text-white">
                    Drop your images here
                  </span>

                  <span className="mt-2 text-sm text-slate-400">
                    or click to browse your device
                  </span>

                  <span className="mt-4 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-slate-400">
                    JPEG, PNG, WebP, AVIF · Maximum 20 MB per image
                  </span>
                </button>

                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    addFiles(event.target.files);
                    event.target.value = "";
                  }}
                />

                {/* FILE LIST */}
                {files.length > 0 && (
                  <div className="mt-7">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-200">
                        Your images ({files.length})
                      </p>

                      <p className="text-xs font-medium text-slate-500">
                        Total: {formatBytes(totalSize)}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {files.map((item) => (
                        <div
                          key={item.id}
                          className={`relative flex min-w-0 items-center gap-3 rounded-2xl border p-3 transition ${
                            selectedId === item.id
                              ? "border-blue-400/50 bg-blue-500/10"
                              : "border-white/[0.07] bg-white/[0.025] hover:border-white/20"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedId(item.id)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                            <img
                              src={item.url}
                              alt={item.file.name}
                              className="h-14 w-14 shrink-0 rounded-xl border border-white/10 bg-[#172642] object-cover"
                            />

                            <span className="min-w-0">
                              <span className="block truncate text-sm font-bold text-slate-200">
                                {item.file.name}
                              </span>

                              <span className="mt-1 block text-xs text-slate-500">
                                {formatBytes(item.file.size)}
                              </span>

                              {item.status === "processing" && (
                                <span className="mt-1 flex items-center gap-1 text-xs font-bold text-blue-400">
                                  <LoaderCircle size={12} className="animate-spin" />
                                  Processing
                                </span>
                              )}

                              {item.status === "success" && (
                                <span className="mt-1 flex items-center gap-1 text-xs font-bold text-emerald-400">
                                  <Check size={12} />
                                  Compressed
                                </span>
                              )}

                              {item.status === "error" && (
                                <span className="mt-1 flex items-center gap-1 text-xs font-bold text-rose-400">
                                  <X size={12} />
                                  Failed
                                </span>
                              )}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => removeFile(item.id)}
                            disabled={processing}
                            aria-label={`Remove ${item.file.name}`}
                            title="Remove image"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-30"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PREVIEW CARD */}
              {selectedFile && (
                <div className="rounded-3xl border border-white/[0.08] bg-[#101a30] p-5 shadow-xl shadow-black/10 sm:p-7">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Image preview
                      </h3>

                      <p className="mt-1 max-w-md truncate text-sm text-slate-500">
                        {selectedFile.file.name}
                      </p>
                    </div>

                    {selectedFile.status === "success" && (
                      <span className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-400">
                        <CheckCircle2 size={15} />
                        Compression complete
                      </span>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* ORIGINAL */}
                    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#172642]/60">
                      <div className="border-b border-white/[0.07] px-4 py-3">
                        <p className="text-sm font-bold text-slate-200">
                          Original image
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatBytes(selectedFile.file.size)}
                        </p>
                      </div>

                      <div className="flex min-h-48 items-center justify-center p-4">
                        <img
                          src={selectedFile.url}
                          alt="Original preview"
                          className="max-h-64 max-w-full rounded-lg object-contain"
                        />
                      </div>
                    </div>

                    {/* COMPRESSED */}
                    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#172642]/60">
                      <div className="border-b border-white/[0.07] px-4 py-3">
                        <p className="text-sm font-bold text-slate-200">
                          Compressed image
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {selectedFile.result
                            ? formatBytes(selectedFile.result.outputSize)
                            : "Your optimized image will appear here"}
                        </p>
                      </div>

                      <div className="flex min-h-48 items-center justify-center p-4">
                        {selectedFile.result ? (
                          <img
                            src={selectedFile.result.url}
                            alt="Compressed preview"
                            className="max-h-64 max-w-full rounded-lg object-contain"
                          />
                        ) : (
                          <div className="text-center">
                            {selectedFile.status === "processing" ? (
                              <LoaderCircle
                                size={34}
                                className="mx-auto animate-spin text-blue-400"
                              />
                            ) : (
                              <FileImage
                                size={38}
                                className="mx-auto text-slate-600"
                              />
                            )}

                            <p className="mt-3 text-sm font-medium text-slate-500">
                              {selectedFile.status === "processing"
                                ? "Optimizing your image..."
                                : "Waiting for compression"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* INDIVIDUAL FILE ERROR */}
                  {selectedFile.status === "error" && (
                    <div className="mt-5 space-y-3">
                      <ErrorAlert
                        title="Image compression failed"
                        message={selectedFile.error}
                        onClose={() => dismissFileError(selectedFile.id)}
                      />

                      <p className="text-xs leading-5 text-slate-500">
                        Dismissing this error will return the image to
                        the pending list so you can retry it.
                      </p>
                    </div>
                  )}

                  {/* RESULT */}
                  {selectedFile.result && (
                    <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-emerald-300">
                            Your image is ready!
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {selectedFile.result.width} ×{" "}
                            {selectedFile.result.height} px ·{" "}
                            {selectedFile.result.format.toUpperCase()}
                          </p>
                        </div>

                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400">
                          {selectedFile.result.savings}% smaller
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/[0.06] bg-[#101a30] p-3">
                          <p className="text-xs font-medium text-slate-500">
                            Original size
                          </p>
                          <p className="mt-1 text-lg font-bold text-slate-200">
                            {formatBytes(selectedFile.result.originalSize)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-emerald-500/10 bg-[#101a30] p-3">
                          <p className="text-xs font-medium text-slate-500">
                            Compressed size
                          </p>
                          <p className="mt-1 text-lg font-bold text-emerald-400">
                            {formatBytes(selectedFile.result.outputSize)}
                          </p>
                        </div>
                      </div>

                      {targetSize.trim() && (
                        <p className="mt-3 text-xs text-slate-400">
                          Maximum requested: {targetSize} {targetSizeUnit}
                          {selectedFile.result.outputSize <=
                          (targetSizeUnit === "MB"
                            ? Number(targetSize) * 1024 * 1024
                            : Number(targetSize) * 1024)
                            ? " · Target achieved"
                            : " · Output exceeds requested target"}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => downloadResult(selectedFile)}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-500"
                      >
                        <ArrowDownToLine size={18} />
                        Download compressed image
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* BATCH SUMMARY */}
              {successfulFiles.length > 0 && (
                <div className="rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-500/[0.12] to-violet-500/[0.08] p-5 sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-blue-300">
                        Batch compression summary
                      </p>

                      <h3 className="mt-1 text-2xl font-bold text-white">
                        {successfulFiles.length} image
                        {successfulFiles.length === 1 ? "" : "s"} completed
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        Saved{" "}
                        {formatBytes(
                          Math.max(
                            0,
                            totalOriginalSize - totalCompressedSize
                          )
                        )}{" "}
                        across your compressed images.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#101a30] px-5 py-4 text-center">
                      <p className="text-3xl font-bold text-emerald-400">
                        {totalSavings}%
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        TOTAL SAVINGS
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={downloadAll}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500"
                  >
                    <ArrowDownToLine size={18} />
                    Download all compressed images
                  </button>

                  <p className="mt-3 text-center text-xs text-slate-500">
                    Your browser may ask you to allow multiple downloads.
                  </p>
                </div>
              )}
            </div>

            {/* SETTINGS SIDEBAR */}
            <aside className="h-fit space-y-5 lg:sticky lg:top-6">
              <div className="rounded-3xl border border-white/[0.08] bg-[#101a30] p-5 shadow-xl shadow-black/10 sm:p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-2.5 text-blue-400">
                    <Settings2 size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-white">
                      Compression settings
                    </h3>
                    <p className="text-xs text-slate-500">
                      Customize your output
                    </p>
                  </div>
                </div>

                {/* PRESETS */}
                <div>
                  <label className="mb-3 block text-sm font-bold text-slate-300">
                    Compression preset
                  </label>

                  <div className="space-y-2">
                    {presets.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => applyPreset(item.name)}
                        disabled={processing}
                        className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition disabled:opacity-50 ${
                          preset === item.name
                            ? "border-blue-400/50 bg-blue-500/10"
                            : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                        }`}
                      >
                        <span>
                          <span className="block text-sm font-bold text-slate-200">
                            {item.name}
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">
                            {item.description}
                          </span>
                        </span>

                        {preset === item.name && (
                          <CheckCircle2
                            size={18}
                            className="shrink-0 text-blue-400"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="my-6 border-t border-white/[0.07]" />

                {/* QUALITY */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-300">
                      Image quality
                    </label>

                    <span className="rounded-lg border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-sm font-bold text-blue-300">
                      {quality}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    disabled={processing}
                    onChange={(event) => {
                      setQuality(Number(event.target.value));
                      setPreset("");
                    }}
                    className="h-2 w-full cursor-pointer accent-blue-500 disabled:opacity-50"
                  />

                  <div className="mt-2 flex justify-between text-xs text-slate-500">
                    <span>Smaller file</span>
                    <span>Higher quality</span>
                  </div>
                </div>

                <div className="my-6 border-t border-white/[0.07]" />

                {/* FORMAT */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Output format
                  </label>

                  <div className="relative">
                    <select
                      value={format}
                      disabled={processing}
                      onChange={(event) => setFormat(event.target.value)}
                      className="w-full appearance-none rounded-xl border border-white/10 bg-[#172642] px-4 py-3 text-sm font-bold text-slate-200 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
                    >
                      {formats.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

            

                {/* CUSTOM MAXIMUM OUTPUT SIZE */}
                <div className="hidden">
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Maximum output size
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={targetSize}
                      disabled={processing}
                      onChange={(event) =>
                        setTargetSize(event.target.value)
                      }
                      placeholder="e.g. 100"
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#172642] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-blue-400 disabled:opacity-50"
                    />

                    <div className="relative w-24 shrink-0">
                      <select
                        value={targetSizeUnit}
                        disabled={processing}
                        onChange={(event) =>
                          setTargetSizeUnit(event.target.value)
                        }
                        className="h-full w-full appearance-none rounded-xl border border-white/10 bg-[#172642] px-3 py-3 text-sm font-bold text-slate-200 outline-none focus:border-blue-400 disabled:opacity-50"
                      >
                        <option value="KB">KB</option>
                        <option value="MB">MB</option>
                      </select>

                      <ChevronDown
                        size={15}
                        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Apply the same maximum size to every image in your batch.
                    Leave blank for normal compression.
                  </p>

                  {targetSize.trim() && (
                    <div className="mt-3 rounded-xl border border-blue-400/15 bg-blue-500/[0.06] px-3 py-2.5">
                      <p className="text-xs font-bold text-blue-300">
                        Target: {targetSize} {targetSizeUnit} maximum per image
                      </p>
                    </div>
                  )}
                </div>

                <div className="my-6 border-t border-white/[0.07]" />

                {/* ADVANCED OPTIONS */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex w-full items-center justify-between text-sm font-bold text-slate-300 transition hover:text-white"
                  >
                    <span className="flex items-center gap-2">
                      <Maximize2 size={16} className="text-blue-400" />
                      Advanced resize options
                    </span>

                    <ChevronDown
                      size={17}
                      className={`transition ${
                        showAdvanced ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showAdvanced && (
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-2 block text-xs font-bold text-slate-400">
                            Width (px)
                          </label>

                          <input
                            type="number"
                            min="1"
                            max="8000"
                            value={width}
                            disabled={processing}
                            onChange={(event) =>
                              setWidth(event.target.value)
                            }
                            placeholder="Original"
                            className="w-full rounded-xl border border-white/10 bg-[#172642] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-bold text-slate-400">
                            Height (px)
                          </label>

                          <input
                            type="number"
                            min="1"
                            max="8000"
                            value={height}
                            disabled={processing}
                            onChange={(event) =>
                              setHeight(event.target.value)
                            }
                            placeholder="Original"
                            className="w-full rounded-xl border border-white/10 bg-[#172642] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400"
                          />
                        </div>
                      </div>

                      <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-400">
                        <input
                          type="checkbox"
                          checked={keepRatio}
                          disabled={processing}
                          onChange={(event) =>
                            setKeepRatio(event.target.checked)
                          }
                          className="h-4 w-4 accent-blue-500"
                        />
                        Keep aspect ratio
                      </label>
                    </div>
                  )}
                </div>

                {/* BATCH ERROR */}
                {batchError && (
                  <div className="mt-6">
                    <ErrorAlert
                      title="Action could not be completed"
                      message={batchError}
                      onClose={() => setBatchError("")}
                    />
                  </div>
                )}

                
{/* OPTIMIZATION BUTTON */}
<div className="mt-7">
  <button
    type="button"
    onClick={compressImages}
    disabled={
      !files.length ||
      processing ||
      allCompressed
    }
    className={`group relative isolate flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-4 text-base font-bold text-white shadow-xl transition duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${
      allCompressed
        ? "bg-emerald-600"
        : processing
          ? "bg-blue-600"
          : "compressor-gradient bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 shadow-blue-950/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/40"
    }`}
  >
    {!processing &&
      files.length > 0 &&
      !allCompressed && (
        <span className="compressor-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      )}

    {processing ? (
      <>
        <LoaderCircle size={20} className="animate-spin" />
        Processing {completedCount}/{totalToProcess}
      </>
    ) : allCompressed ? (
      <>
        <CheckCircle2 size={19} />
        All Images Processed
      </>
    ) : failedFiles.length > 0 ? (
      <>
        <RefreshCw size={19} />
        Retry Failed Images
      </>
    ) : successfulFiles.length > 0 ? (
      <>
        <Sparkles size={19} />
        Process Remaining Images
      </>
    ) : (
      <>
        <Zap size={19} fill="currentColor" />
       Apply Styles
        <Sparkles size={17} />
      </>
    )}
  </button>

  {/* PROGRESS */}
  {processing && (
    <div className="mt-4">
      <div className="mb-2 flex justify-between text-xs font-bold text-slate-400">
        <span>Optimizing your images</span>
        <span>{progress}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )}

  <p className="mt-3 text-center text-xs leading-5 text-slate-500">
    {processing
      ? "Please keep this tab open while processing."
      : allCompressed
        ? "Your images are ready. Download them or add more images."
        : "Compress, convert and optimize your images with customizable settings."}
  </p>
</div>

              </div>

              {/* PRIVACY CARD */}
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4">
                <div className="flex items-start gap-3">
                  <LockKeyhole
                    size={19}
                    className="mt-0.5 shrink-0 text-emerald-400"
                  />

                  <div>
                    <p className="text-sm font-bold text-emerald-300">
                      Your files, your privacy
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Images are processed by our server. Avoid uploading
                      confidential images on shared devices.
                    </p>
                  </div>
                </div>
              </div>

              {/* FAILED FILE SUMMARY */}
              {failedFiles.length > 0 && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-4">
                  <div className="flex items-center gap-2 text-rose-300">
                    <X size={17} />
                    <p className="text-sm font-bold">
                      {failedFiles.length} image
                      {failedFiles.length === 1 ? "" : "s"} need attention
                    </p>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Select a failed image to view its error. Dismiss the
                    error to return it to the pending list, then retry.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="relative z-10 border-y border-white/[0.06] bg-white/[0.015] px-5 py-16 sm:px-8 sm:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-400">
              Built for everyday work
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything you need to optimize images
            </h2>

            <p className="mt-4 leading-7 text-slate-400">
              Straightforward controls make image optimization simple
              for everyone.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Zap,
                title: "Fast compression",
                description:
                  "Optimize images with a simple workflow and get your results quickly.",
              },
              {
                icon: Settings2,
                title: "Flexible settings",
                description:
                  "Choose quality, output format, and image dimensions.",
              },
              {
                icon: FileImage,
                title: "Batch uploads",
                description:
                  "Add multiple images and process them in one session.",
              },
              {
                icon: ShieldCheck,
                title: "Simple & private",
                description:
                  "No account or login is required to use the compressor.",
              },
            ].map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-white/[0.07] bg-[#101a30] p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-[#14213a]"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-500/10 text-blue-400">
                    <Icon size={23} />
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="relative z-10 border-y border-white/[0.06] bg-[#101a30] px-5 py-16 sm:px-8 sm:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-400">
              Three simple steps
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              How image compression works
            </h2>

            <p className="mt-4 leading-7 text-slate-400">
              No complicated software. Just upload, optimize and download.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                icon: Upload,
                title: "Upload your images",
                description:
                  "Choose images from your device or drag and drop them into the upload area.",
              },
              {
                number: "02",
                icon: Settings2,
                title: "Choose your settings",
                description:
                  "Select a quality preset, output format, maximum file size and optional dimensions.",
              },
              {
                number: "03",
                icon: ArrowDownToLine,
                title: "Download your results",
                description:
                  "Preview the optimized image, compare file sizes and download it.",
              },
            ].map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="rounded-3xl border border-white/[0.07] bg-[#172642]/70 p-7 transition hover:border-blue-400/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-blue-400">
                      {step.number}
                    </span>

                    <div className="rounded-xl border border-blue-400/15 bg-blue-500/10 p-3 text-blue-400">
                      <Icon size={23} />
                    </div>
                  </div>

                  <h3 className="mt-7 text-xl font-bold text-white">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <a
              href="#compressor"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-950/30 transition hover:-translate-y-1 hover:shadow-2xl"
            >
              Start compressing
              <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}



const phrases = [
  "Compress Your Images",
  "Convert Your Images to Any Format",
];

function ImageStudioHeading() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];

    let delay = deleting ? 35 : 75;

    if (!deleting && text === currentPhrase) {
      delay = 1600;
    } else if (deleting && text === "") {
      delay = 400;
    }

    const timer = setTimeout(() => {
      if (!deleting && text === currentPhrase) {
        setDeleting(true);
      } else if (deleting && text === "") {
        setDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      } else if (deleting) {
        setText(currentPhrase.slice(0, text.length - 1));
      } else {
        setText(currentPhrase.slice(0, text.length + 1));
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [text, deleting, phraseIndex]);

  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-400">
        Image Optimization Studio
      </p>

      <h2 className="mt-4 min-h-[88px] text-3xl font-bold tracking-tight sm:min-h-[96px] sm:text-4xl md:text-5xl">
        <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
          {text}
        </span>
        <span className="ml-1 inline-block h-[0.9em] w-[3px] translate-y-1 animate-pulse bg-cyan-400" />
      </h2>

      <p className="mt-4 leading-7 text-slate-400">
        Compress images, convert between popular formats,
        and customize your output settings. Let DigiTool
        handle your image optimization effortlessly.
      </p>
    </div>
  );
}
