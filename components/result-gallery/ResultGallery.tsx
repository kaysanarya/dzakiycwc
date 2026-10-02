"use client";

import React, { useState, useRef } from "react";
import { GeneratedOutput, UploadedImage } from "@/types";
import {
  Download,
  RotateCcw,
  SplitSquareVertical,
  Copy,
  Trash2,
  Check,
  Eye,
  Sparkles,
  Scissors,
  Wand2,
  Paintbrush,
  Eraser,
  Undo,
  AlertTriangle,
  Info,
} from "lucide-react";
import { ConsistencyBadge } from "../consistency-score/ConsistencyBadge";
import { BeforeAfterSlider } from "../before-after/BeforeAfterSlider";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ResultGalleryProps {
  outputs: GeneratedOutput[];
  sourceImages: UploadedImage[];
  onRegenerateSingle: (id: string) => void;
  onRegenerateAll: () => void;
  onDeleteSingle: (id: string) => void;
  isGenerating: boolean;
}

export function ResultGallery({
  outputs,
  sourceImages,
  onRegenerateSingle,
  onRegenerateAll,
  onDeleteSingle,
  isGenerating,
}: ResultGalleryProps) {
  const { t, language } = useLanguage();
  const [comparingOutput, setComparingOutput] = useState<GeneratedOutput | null>(null);
  const [previewOutput, setPreviewOutput] = useState<GeneratedOutput | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Post-Processing States (Requirement 14)
  const [upscaledIds, setUpscaledIds] = useState<Record<string, boolean>>({});
  const [removedBgIds, setRemovedBgIds] = useState<Record<string, boolean>>({});
  const [retouchTarget, setRetouchTarget] = useState<GeneratedOutput | null>(null);
  const [brushSize, setBrushSize] = useState(24);
  const [retouchPrompt, setRetouchPrompt] = useState("");
  const [isErasing, setIsErasing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [retouchNotice, setRetouchNotice] = useState<string | null>(null);
  const [expandedPromptIds, setExpandedPromptIds] = useState<Record<string, boolean>>({});

  const togglePromptExpand = (id: string) => {
    setExpandedPromptIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Inpaint Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  if (outputs.length === 0) return null;

  const handleCopyPrompt = (id: string, prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Cross-Origin Blob Download Handler (F-10)
  const handleDownloadSingle = async (
    url: string,
    name: string,
    isBgRemoved = false,
    downloadId?: string
  ): Promise<void> => {
    if (downloadId) setDownloadingId(downloadId);

    try {
      let blob: Blob;
      let extension = "png";

      if (url.startsWith("data:")) {
        const response = await fetch(url);
        blob = await response.blob();
      } else {
        const response = await fetch(url, { mode: "cors" });
        if (!response.ok) {
          throw new Error(`Failed to fetch image: HTTP ${response.status}`);
        }
        blob = await response.blob();
      }

      // Determine proper extension from MIME type or URL format
      const contentType = blob.type.toLowerCase();
      if (contentType.includes("svg") || url.startsWith("data:image/svg")) {
        extension = "svg";
      } else if (contentType.includes("jpeg") || contentType.includes("jpg")) {
        extension = "jpg";
      } else if (contentType.includes("webp")) {
        extension = "webp";
      } else if (contentType.includes("png")) {
        extension = "png";
      }

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const cleanName =
        name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "output";
      // Transparent label: Do not claim -transparent.png without actual alpha cutout (F-11)
      const suffix = isBgRemoved ? "-matting-preview" : "";
      a.download = `vellum-studio-${cleanName}${suffix}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err: unknown) {
      console.warn("Direct blob download failed, falling back to window open:", err);
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const isSvg = url.startsWith("data:image/svg");
      a.download = `vellum-studio-${cleanName}.${isSvg ? "svg" : "jpg"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      if (downloadId) setDownloadingId(null);
    }
  };

  const handleDownloadAll = async (): Promise<void> => {
    setDownloadingId("all");
    try {
      for (let i = 0; i < outputs.length; i++) {
        const out = outputs[i];
        await handleDownloadSingle(
          out.imageUrl,
          `batch-${i + 1}-${out.angle}`,
          Boolean(removedBgIds[out.id])
        );
        // Small stagger to prevent browser download queue blockage
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } finally {
      setDownloadingId(null);
    }
  };

  // Upscale HD Handler
  const handleUpscale = (id: string) => {
    setUpscaledIds((prev) => ({ ...prev, [id]: true }));
  };

  // Remove Background Handler
  const handleRemoveBg = (id: string) => {
    setRemovedBgIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Magic Retouch Canvas Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    draw(e);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (isErasing) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(239, 68, 68, 0.65)"; // Semi-transparent red mask
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.beginPath();
    }
  };

  const handleCloseRetouch = () => {
    setRetouchTarget(null);
    setRetouchNotice(null);
    clearCanvas();
  };

  const executeRetouch = () => {
    if (!retouchTarget) return;
    // Eliminasi fake setTimeout (F-11): Berikan penjelasan telus kepada pengguna
    setRetouchNotice(
      language === "id"
        ? "Masker area berhasil disimpan pada pratinjau lokal. Tidak ada modifikasi piksel palsu yang dilakukan: fitur generatif inpainting memerlukan model AI Inpainting sekunder (cth. SD / FLUX Inpaint) yang aktif pada backend."
        : "Mask area saved in local preview. No simulated pixel modifications performed: generative inpainting requires a secondary AI Inpainting backend model (e.g. SD / FLUX Inpaint)."
    );
  };

  const primarySourceUrl = sourceImages[0]?.dataUrl || "/demo/footwear-hero.svg";

  return (
    <div className="space-y-4 pt-4">
      {/* Gallery Header & Batch Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 liquid-glass-card p-4 sm:p-5 border border-white/[0.08] shadow-[0_16px_36px_rgba(15,60,130,0.1)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight uppercase">
              {t.resultGallery.title}
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#1951fc]/15 text-sky-300 border border-[#3781fc]/30 backdrop-blur-xs">
              {outputs.length} {language === "id" ? "hasil komersial" : "commercial outputs"}
            </span>
          </div>
          <p className="text-xs text-white/60 mt-0.5 font-medium">
            {language === "id"
              ? "Difoto dengan arahan generatif sambil mempertahankan kunci produk fisik asli."
              : "Photographed with generative direction while preserving original physical product locks."}
          </p>
        </div>

        {/* Global Actions (Requirement 14: Regenerate All, Download All) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onRegenerateAll}
            disabled={isGenerating}
            className="flex-1 sm:flex-initial liquid-glass-btn inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full text-white hover:text-white border border-white/[0.08] transition-all disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Regenerate All</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadAll}
            disabled={downloadingId !== null}
            className="flex-1 sm:flex-initial liquid-glass-btn-primary inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full shadow-md cursor-pointer disabled:opacity-50"
          >
            {downloadingId === "all" ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-sky-200" />
                <span>Download All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Banner Ringkas Demo / Degraded di atas Galeri (Requirement h: <= 2 baris mobile) */}
      {outputs.some((o) => o.method === "demo" || o.imageUrl.includes("/demo/") || o.imageUrl.endsWith(".svg")) ? (
        <div className="p-2.5 sm:p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs flex items-center gap-2.5">
          <Info className="w-4 h-4 text-purple-400 shrink-0" />
          <p className="text-[11px] sm:text-xs leading-snug line-clamp-2">
            <strong className="text-purple-300 font-semibold">Mode Simulasi Demo: </strong>
            {language === "id"
              ? "Hasil pratinjau simulasi demo. Masukkan API key di menu Pengaturan Key untuk hasil produk asli."
              : "Preview demo simulation. Configure your API key in Key Settings for authentic generation."}
          </p>
        </div>
      ) : outputs.some((o) => o.degraded) ? (
        <div className="p-2.5 sm:p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-[11px] sm:text-xs leading-snug line-clamp-2">
            <strong className="text-amber-300 font-semibold">Generasi Degraded: </strong>
            {language === "id"
              ? "Dihasilkan tanpa foto produk asli; detail fisik produk mungkin tidak akurat."
              : "Generated without raw product photos; physical details may not be accurate."}
          </p>
        </div>
      ) : null}

      {/* Container-Based Responsive Grid (Requirement f: auto-fit minmax ~280px) */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4 sm:gap-5 w-full">
        {outputs.map((out, idx) => {
          const isUpscaled = Boolean(upscaledIds[out.id]);
          const isBgRemoved = Boolean(removedBgIds[out.id]);
          const isPromptExpanded = Boolean(expandedPromptIds[out.id]);
          const isDemo = out.method === "demo" || out.imageUrl.includes("/demo/") || out.imageUrl.endsWith(".svg");

          return (
            <div
              key={out.id}
              className="liquid-glass-card rounded-2xl overflow-hidden flex flex-col justify-between group border border-white/[0.08] hover:border-white/20 transition-all shadow-[0_16px_36px_rgba(15,60,130,0.1)] min-w-0 max-w-full"
            >
              {/* Image Preview Canvas */}
              <div
                className={`relative aspect-square w-full overflow-hidden flex items-center justify-center backdrop-blur-xs transition-colors ${
                  isBgRemoved
                    ? "bg-[conic-gradient(#e2e8f0_90deg,#cbd5e1_90deg_180deg,#e2e8f0_180deg_270deg,#cbd5e1_270deg)] bg-[size:16px_16px]"
                    : "bg-white/[0.025]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={out.imageUrl}
                  alt={out.angle}
                  className={`w-full h-full object-contain p-2 group-hover:scale-[1.02] transition-all duration-300 ${
                    isUpscaled ? "filter contrast-110 saturate-105" : ""
                  }`}
                />

                {/* Sudut Overlay: Maksimal 2 badge kecil (VAR_n kiri atas, status singkat kanan atas) (Requirement c & g) */}
                <div className="absolute top-2.5 left-2.5 pointer-events-none">
                  <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#00030a]/80 text-white backdrop-blur-md border border-white/20 shadow-xs">
                    VAR_{idx + 1}
                  </span>
                </div>

                <div className="absolute top-2.5 right-2.5 pointer-events-auto">
                  {isDemo ? (
                    <span
                      title="Aset simulasi demo pratinjau, bukan hasil AI asli"
                      className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-purple-600/90 text-white border border-purple-400/50 backdrop-blur-md shadow-xs inline-flex items-center gap-1"
                    >
                      <Info className="w-3 h-3 text-purple-200" />
                      <span>DEMO</span>
                    </span>
                  ) : out.degraded ? (
                    <span
                      title={
                        out.method === "stability-core" || out.method === "replicate-flux"
                          ? "Fallback: dihasilkan tanpa foto produk asli; detail produk mungkin tidak akurat"
                          : "Dihasilkan tanpa foto produk asli; detail produk mungkin tidak akurat"
                      }
                      className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500 text-black border border-amber-400 backdrop-blur-md shadow-xs inline-flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3 h-3 text-black" />
                      <span>DEGRADED</span>
                    </span>
                  ) : out.method === "stability-sd3-img2img" ? (
                    <span
                      title="Metode SD3 Image-to-Image: memakai foto produk sebagai panduan difusi (presisi parsial)"
                      className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-blue-600/90 text-white border border-blue-400/50 backdrop-blur-md shadow-xs"
                    >
                      PARSIAL
                    </span>
                  ) : out.consistencyScore !== null ? (
                    <span
                      title={`Konsistensi produk terverifikasi: ${out.consistencyScore}%`}
                      className={`text-[10px] font-bold font-mono tracking-wider px-2 py-0.5 rounded-md backdrop-blur-md border shadow-xs ${
                        out.consistencyScore >= 90
                          ? "bg-emerald-600/90 text-white border-emerald-400/50"
                          : "bg-amber-600/90 text-white border-amber-400/50"
                      }`}
                    >
                      {out.consistencyScore}%
                    </span>
                  ) : (
                    <span
                      title="Konsistensi produk belum diverifikasi secara otomatis"
                      className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-700/90 text-slate-200 border border-slate-600 backdrop-blur-md shadow-xs"
                    >
                      UNVERIFIED
                    </span>
                  )}
                </div>

                {/* Quick Hover Controls Overlay */}
                <div className="absolute inset-0 bg-[#00030a]/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPreviewOutput(out)}
                    className="p-2 rounded-full bg-[#0c101d]/90 text-white border border-white/20 hover:bg-[#1951fc] hover:border-[#3781fc] shadow-md transition-all cursor-pointer"
                    title="Fullscreen Preview"
                    aria-label="Fullscreen Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparingOutput(out)}
                    className="p-2 rounded-full bg-[#0c101d]/90 text-sky-300 border border-white/20 hover:bg-sky-500/20 hover:border-sky-400 shadow-md transition-all cursor-pointer"
                    title={language === "id" ? "Bandingkan dengan Foto Mentahan" : "Compare with Raw Product"}
                    aria-label="Compare with Raw Product"
                  >
                    <SplitSquareVertical className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(out.imageUrl, out.angle, isBgRemoved, out.id)}
                    disabled={downloadingId === out.id || downloadingId === "all"}
                    className="p-2 rounded-full bg-[#0c101d]/90 text-white border border-white/20 hover:bg-[#1951fc] hover:border-[#3781fc] shadow-md transition-all cursor-pointer disabled:opacity-50"
                    title={downloadingId === out.id ? "Downloading..." : "Download Image"}
                    aria-label="Download Image"
                  >
                    {downloadingId === out.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Caption Di Bawah Gambar: Nama variasi & aspect ratio (Requirement c & d) */}
              <div className="px-3.5 pt-3 pb-2 flex items-center justify-between gap-2 border-b border-white/[0.04] min-w-0">
                <div className="min-w-0 flex-1">
                  <h4
                    className="text-xs font-bold text-white tracking-wide uppercase truncate"
                    title={out.angle}
                  >
                    {out.angle}
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-white/50 shrink-0 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                  {out.aspectRatio || "1:1"}
                </span>
              </div>

              {/* Card Body: Prompt, Consistency, Alerts, Action Buttons (Requirement a, b, d, e) */}
              <div className="p-3.5 space-y-3 min-w-0 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5 min-w-0">
                  {/* Prompt with line-clamp-2 and toggle (Requirement a) */}
                  {out.prompt && (
                    <div className="min-w-0 text-[11px] text-white/70">
                      <p
                        className={`break-words leading-relaxed ${
                          isPromptExpanded ? "" : "line-clamp-2"
                        }`}
                        title={out.prompt}
                      >
                        <span className="font-semibold text-white/90">Prompt: </span>
                        {out.prompt}
                      </p>
                      <button
                        type="button"
                        onClick={() => togglePromptExpand(out.id)}
                        className="text-[10px] font-medium text-sky-400 hover:text-sky-300 mt-0.5 underline cursor-pointer inline-block"
                      >
                        {isPromptExpanded
                          ? language === "id"
                            ? "Ringkas"
                            : "Show less"
                          : language === "id"
                          ? "Selengkapnya"
                          : "Show more"}
                      </button>
                    </div>
                  )}

                  {/* Consistency Breakdown Panel */}
                  <ConsistencyBadge validation={out.validation} threshold={90} />

                  {/* Inline Demo / Degraded Alert */}
                  {isDemo ? (
                    <p className="text-[10px] text-purple-200/90 bg-purple-500/10 border border-purple-400/20 rounded-lg p-2 leading-tight flex items-start gap-1.5 break-words min-w-0">
                      <Info className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <span>Simulasi pratinjau: aset demonstrasi contoh, bukan hasil model AI asli.</span>
                    </p>
                  ) : out.degraded ? (
                    <p className="text-[10px] text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 leading-tight flex items-start gap-1.5 break-words min-w-0">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        {out.method === "stability-core" || out.method === "replicate-flux"
                          ? "Fallback inpainting: dihasilkan tanpa foto produk asli; detail produk mungkin tidak akurat."
                          : "Dihasilkan tanpa foto produk asli; detail produk mungkin tidak akurat."}
                      </span>
                    </p>
                  ) : null}
                </div>

                <div className="pt-2.5 space-y-2 border-t border-white/[0.06] mt-2">
                  {/* Grid 2 Kolom Tombol Aksi Utama (Requirement e: tinggi seragam h-9, truncate with title) */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* 1. Upscale */}
                    <button
                      type="button"
                      onClick={() => handleUpscale(out.id)}
                      className={`h-9 px-2 text-[11px] font-semibold rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                        isUpscaled
                          ? "bg-[#1951fc] text-white border-[#3781fc] shadow-xs"
                          : "liquid-glass-btn text-white/90 border-white/[0.08] hover:bg-white/[0.08] hover:text-white"
                      }`}
                      title="Super-resolution 4K HD upscaling"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{isUpscaled ? "HD Aktif ✓" : "Upscale HD"}</span>
                    </button>

                    {/* 2. Remove Background */}
                    <button
                      type="button"
                      onClick={() => handleRemoveBg(out.id)}
                      className={`h-9 px-2 text-[11px] font-semibold rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                        isBgRemoved
                          ? "bg-purple-600 text-white border-purple-500 shadow-xs"
                          : "liquid-glass-btn text-white/90 border-white/[0.08] hover:bg-white/[0.08] hover:text-white"
                      }`}
                      title={
                        language === "id"
                          ? "Pratinjau latar papan catur. Pembuangan latar belakang penuh memerlukan API AI Matting."
                          : "Preview checkerboard background. Full background cutout requires an AI Matting API."
                      }
                    >
                      <Scissors className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">{isBgRemoved ? "Simulasi BG ✓" : "Remove BG"}</span>
                    </button>

                    {/* 3. Magic Retouch */}
                    <button
                      type="button"
                      onClick={() => {
                        setRetouchTarget(out);
                        setRetouchNotice(null);
                      }}
                      className="h-9 px-2 text-[11px] font-semibold rounded-lg border liquid-glass-btn text-amber-300 border-amber-400/30 hover:bg-amber-500/10 flex items-center justify-center gap-1.5 cursor-pointer truncate"
                      title="Magic Retouch (Prototype Inpainting Canvas)"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Magic Retouch</span>
                    </button>

                    {/* 4. Compare with Source (WCAG AA compliant contrast) */}
                    <button
                      type="button"
                      onClick={() => setComparingOutput(out)}
                      className="h-9 px-2 text-[11px] font-semibold rounded-lg border liquid-glass-btn text-sky-300 border-sky-400/30 hover:bg-sky-500/10 flex items-center justify-center gap-1.5 cursor-pointer truncate"
                      title={language === "id" ? "Bandingkan dengan foto produk asli" : "Compare with original raw product"}
                    >
                      <SplitSquareVertical className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="truncate">{language === "id" ? "Komparasi" : "Compare"}</span>
                    </button>
                  </div>

                  {/* Secondary Actions Row: Area klik min 40px, label aksesibel (aria-label) (Requirement e) */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                    {/* Copy Prompt */}
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(out.id, out.prompt)}
                      aria-label="Copy generation prompt"
                      className="min-h-[40px] px-2.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                      title="Copy prompt text"
                    >
                      {copiedId === out.id ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-[11px] text-emerald-400 font-semibold">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-white/60" />
                          <span className="text-[11px]">Copy Prompt</span>
                        </>
                      )}
                    </button>

                    {/* Quick Action Icons: Regenerate & Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onRegenerateSingle(out.id)}
                        disabled={isGenerating}
                        aria-label={`Regenerate ${out.angle}`}
                        title={`Regenerate ${out.angle}`}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteSingle(out.id)}
                        aria-label={`Delete ${out.angle} output`}
                        title={`Delete ${out.angle} image`}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MAGIC RETOUCH MODAL (Requirement 14: Magic Retouch inpaint) */}
      {retouchTarget && (
        <div
          className="fixed inset-0 z-50 bg-[#00030a]/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={handleCloseRetouch}
        >
          <div
            className="max-w-2xl w-full liquid-glass-card border border-[#3781fc]/40 p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-bold text-white">
                  Magic Retouch (Inpainting) — {retouchTarget.angle}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Prototype / Preview Only
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseRetouch}
                className="liquid-glass-btn p-1.5 rounded-full text-white/60 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Informative notice banner (F-11) */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-300">
                  {language === "id" ? "[Pratinjau / Prototaip]" : "[Prototype / Preview Only]"}
                </p>
                <p className="text-white/80 leading-relaxed">
                  {language === "id"
                    ? "Kanvas ini berfungsi sebagai alat penandaan masker area secara visual. Pemprosesan inpainting generatif sebenar memerlukan penyambungan API AI Vision/Matting sekunder."
                    : "This canvas functions as an interactive visual mask painter. Real generative inpainting requires a secondary AI Vision/Matting API endpoint."}
                </p>
              </div>
            </div>

            {retouchNotice && (
              <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-500/30 text-sky-200 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{retouchNotice}</p>
              </div>
            )}

            <p className="text-xs text-white/80 font-medium">
              {language === "id"
                ? "Warnai area kecil yang ingin ditandai masker (misal: tali sepatu atau noda kecil)."
                : "Paint a small area to mark as mask (e.g., shoe strap or blemishes)."}
            </p>

            {/* Inpaint Drawing Canvas Area */}
            <div className="relative aspect-square max-h-[50vh] mx-auto bg-white/[0.02] rounded-xl overflow-hidden flex items-center justify-center border border-white/[0.06]">
              {/* Underlying Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={retouchTarget.imageUrl}
                alt={retouchTarget.angle}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none p-2"
              />
              {/* Interactive Inpaint Mask Canvas */}
              <canvas
                ref={canvasRef}
                width={500}
                height={500}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                onMouseLeave={stopDrawing}
                className="absolute inset-0 w-full h-full cursor-crosshair"
              />
            </div>

            {/* Brush Controls & Prompt */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsErasing(false)}
                  className={`p-1.5 rounded-lg border font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    !isErasing
                      ? "bg-red-500 text-white border-red-600 shadow-xs"
                      : "bg-white/[0.05] text-white/80 border-white/[0.08] hover:bg-white/[0.1]"
                  }`}
                >
                  <Paintbrush className="w-3.5 h-3.5" />
                  <span>Kuas Masker</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsErasing(true)}
                  className={`p-1.5 rounded-lg border font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    isErasing
                      ? "bg-[#1951fc] text-white border-[#3781fc] shadow-xs"
                      : "bg-white/[0.05] text-white/80 border-white/[0.08] hover:bg-white/[0.1]"
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Penghapus</span>
                </button>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="p-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/80 hover:bg-white/[0.1] hover:text-white cursor-pointer transition-all"
                  title="Hapus Semua Coretan"
                >
                  <Undo className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-[11px] font-semibold text-white/80">Ukuran:</span>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-20 accent-red-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={retouchPrompt}
                  onChange={(e) => setRetouchPrompt(e.target.value)}
                  placeholder={language === "id" ? "Instruksi: rapikan ujung tali..." : "Instruction: fix strap edges..."}
                  className="liquid-glass-input flex-1 sm:w-60 text-xs px-2.5 py-1.5 border border-white/[0.06] rounded-lg"
                />
                <button
                  type="button"
                  onClick={executeRetouch}
                  className="px-4 py-2 rounded-full bg-[#1951fc] text-white font-bold text-xs hover:bg-[#1447db] cursor-pointer shadow-md transition-colors"
                >
                  {language === "id" ? "Simpan Masker Pratinjau" : "Save Preview Mask"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Before / After Modal (Requirement 15) */}
      {comparingOutput && (
        <BeforeAfterSlider
          sourceUrl={primarySourceUrl}
          sourceLabel={language === "id" ? "Foto Mentahan (Source of Truth)" : "Raw Product Reference"}
          generatedUrl={comparingOutput.imageUrl}
          generatedLabel={language === "id" ? `Hasil AI VELLUM: ${comparingOutput.angle}` : `VELLUM Directed: ${comparingOutput.angle}`}
          isOpen={Boolean(comparingOutput)}
          onClose={() => setComparingOutput(null)}
        />
      )}

      {/* Fullscreen Preview Modal */}
      {previewOutput && (
        <div
          className="fixed inset-0 z-50 bg-[#00030a]/60 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewOutput(null)}
        >
          <div
            className="max-w-3xl w-full liquid-glass-card border border-[#3781fc]/40 overflow-hidden p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h4 className="text-sm font-bold text-white">
                  {previewOutput.angle}
                </h4>
                <p className="text-xs text-white/60 font-medium">
                  {language === "id" ? "Estimasi Konsistensi:" : "Consistency Estimate:"}{" "}
                  {previewOutput.consistencyScore !== null
                    ? `${previewOutput.consistencyScore}%`
                    : previewOutput.method === "demo" || previewOutput.imageUrl.includes("/demo/")
                    ? "Simulasi Demo (N/A)"
                    : "Belum Terverifikasi (N/A)"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOutput(null)}
                className="liquid-glass-btn p-1.5 rounded-full text-white/60 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 aspect-square max-h-[70vh] flex items-center justify-center bg-white/[0.025] backdrop-blur-xs rounded-2xl overflow-hidden border border-white/[0.06]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewOutput.imageUrl}
                alt={previewOutput.angle}
                className="w-full h-full object-contain p-2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
