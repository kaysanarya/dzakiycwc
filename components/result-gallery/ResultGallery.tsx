"use client";

import React, { useState } from "react";
import { GeneratedOutput, UploadedImage } from "@/types";
import {
  Download,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Info,
  HelpCircle,
  SplitSquareVertical,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ResultGalleryProps {
  outputs: GeneratedOutput[];
  sourceImages: UploadedImage[];
  onRegenerateSingle: (id: string) => void;
  onRegenerateAll: () => void;
  onDeleteSingle: (id: string) => void;
  onSelectOutput?: (output: GeneratedOutput) => void;
  selectedOutputId?: string;
  isGenerating: boolean;
}

export function ResultGallery({
  outputs,
  sourceImages: _sourceImages,
  onRegenerateSingle,
  onRegenerateAll: _onRegenerateAll,
  onDeleteSingle,
  onSelectOutput,
  selectedOutputId,
  isGenerating,
}: ResultGalleryProps) {
  const { language } = useLanguage();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (outputs.length === 0) return null;

  const handleDownloadSingle = async (
    url: string,
    name: string,
    format: "png" | "jpg" = "png",
    downloadId?: string
  ): Promise<void> => {
    if (downloadId) setDownloadingId(downloadId);

    try {
      let blob: Blob;
      if (url.startsWith("data:")) {
        const response = await fetch(url);
        blob = await response.blob();
      } else {
        const response = await fetch(url, { mode: "cors" });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        blob = await response.blob();
      }

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "foto-produk";
      a.download = `studio-${cleanName}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    } finally {
      if (downloadId) setDownloadingId(null);
    }
  };

  const getStatusBadge = (out: GeneratedOutput) => {
    const isDemo =
      out.method === "demo" ||
      out.method === "demo-plate-composite" ||
      out.imageUrl.includes("/demo/") ||
      out.imageUrl.endsWith(".svg");

    if (isDemo) {
      return (
        <span
          title="Hasil menggunakan simulasi demo"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-950/70 border border-purple-800 text-purple-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
        >
          <Info className="w-3 h-3 shrink-0" />
          <span className="truncate">Demo</span>
        </span>
      );
    }

    if (out.validation && out.validation.score && out.validation.score >= 80) {
      return (
        <span
          title="Kesesuaian produk terverifikasi"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/70 border border-emerald-800 text-emerald-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
        >
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          <span className="truncate">Hasil AI</span>
        </span>
      );
    }

    return (
      <span
        title="Belum diverifikasi secara otomatis"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-800 border border-zinc-700 text-zinc-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
      >
        <HelpCircle className="w-3 h-3 shrink-0" />
        <span className="truncate">Belum diverifikasi</span>
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {outputs.map((out, idx) => {
          const isSelected = selectedOutputId === out.id || (!selectedOutputId && idx === 0);

          return (
            <div
              key={out.id}
              className={`card-flat overflow-hidden flex flex-col justify-between transition-all ${
                isSelected ? "border-blue-500 ring-1 ring-blue-500" : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {/* Image Preview & Selection Click */}
              <div
                role="button"
                tabIndex={0}
                aria-label={`Pilih variasi ${out.angle || idx + 1}`}
                onClick={() => onSelectOutput?.(out)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onSelectOutput?.(out);
                  }
                }}
                className="relative aspect-square w-full bg-zinc-950 flex items-center justify-center p-2 cursor-pointer focus-visible:outline-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={out.imageUrl}
                  alt={out.angle || `Variasi ${idx + 1}`}
                  className="w-full h-full object-contain pointer-events-none"
                />

                {isSelected && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                    Aktif
                  </div>
                )}
              </div>

              {/* Card Meta & Always-Visible Actions */}
              <div className="p-2.5 space-y-2 border-t border-zinc-800 bg-zinc-900/60">
                {/* Status Badge: One Line Only */}
                <div className="flex items-center justify-between gap-1 overflow-hidden">
                  <div className="min-w-0 flex-1 truncate">
                    {getStatusBadge(out)}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                    {out.aspectRatio || "1:1"}
                  </span>
                </div>

                {/* Always-Visible Action Buttons (No Hover Required) */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(out.imageUrl, out.angle || `foto-${idx + 1}`, "png", out.id)}
                    disabled={downloadingId === out.id}
                    aria-label={`Unduh variasi ${idx + 1} format PNG`}
                    className="btn-secondary h-8 px-2 text-[11px] gap-1 w-full justify-center"
                    title={language === "id" ? "Unduh PNG" : "Download PNG"}
                  >
                    <Download className="w-3 h-3 shrink-0" />
                    <span>PNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRegenerateSingle(out.id)}
                    disabled={isGenerating}
                    aria-label={`Atur ulang variasi ${idx + 1}`}
                    className="btn-secondary h-8 px-2 text-[11px] gap-1 w-full justify-center"
                    title={language === "id" ? "Atur ulang" : "Regenerate"}
                  >
                    <RotateCcw className="w-3 h-3 shrink-0" />
                    <span className="truncate">{language === "id" ? "Atur ulang" : "Retry"}</span>
                  </button>
                </div>

                {/* Compare & Delete utility row */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400">
                  <button
                    type="button"
                    onClick={() => onSelectOutput?.(out)}
                    aria-label={`Bandingkan variasi ${idx + 1} di slider`}
                    className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <SplitSquareVertical className="w-3 h-3" />
                    <span>{language === "id" ? "Lihat slider" : "Compare"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteSingle(out.id)}
                    aria-label={`Hapus variasi ${idx + 1}`}
                    className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
