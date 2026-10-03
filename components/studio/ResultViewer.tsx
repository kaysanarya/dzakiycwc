"use client";

import React, { useState, useRef } from "react";
import { GeneratedOutput, UploadedImage, PhotographyDirection } from "@/types";
import { BeforeAfterSlider } from "@/components/before-after/BeforeAfterSlider";
import {
  Download,
  Share2,
  RotateCcw,
  Sliders,
  Maximize2,
  X,
  FileCode,
  ChevronLeft,
  ChevronRight,
  Camera,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ResultViewerProps {
  outputs: GeneratedOutput[];
  selectedIndex: number;
  onSelectIndex: (idx: number) => void;
  sourceImage?: UploadedImage;
  onDownload: (url: string, name: string) => void;
  onShare?: (url: string, title: string) => void;
  onRegenerate: () => void;
  onOpenBlueprint?: () => void;
  isGenerating?: boolean;
  variant?: "desktop" | "mobile";
  direction: PhotographyDirection;
}

export function ResultViewer({
  outputs,
  selectedIndex,
  onSelectIndex,
  sourceImage,
  onDownload,
  onShare,
  onRegenerate,
  onOpenBlueprint,
  isGenerating = false,
  variant = "desktop",
  direction,
}: ResultViewerProps) {
  const { language } = useLanguage();
  const [showSlider, setShowSlider] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Touch swipe support for mobile
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const activeOutput = outputs[selectedIndex] || outputs[0];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 45; // min swipe distance in px

    if (diff > threshold && selectedIndex < outputs.length - 1) {
      onSelectIndex(selectedIndex + 1);
    } else if (diff < -threshold && selectedIndex > 0) {
      onSelectIndex(selectedIndex - 1);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const resString =
    direction.aspectRatio === "4:5"
      ? "1024 × 1280 px"
      : direction.aspectRatio === "16:9"
      ? "1280 × 720 px"
      : direction.aspectRatio === "9:16"
      ? "720 × 1280 px"
      : "1024 × 1024 px";

  // MOBILE VARIANT
  if (variant === "mobile") {
    return (
      <div className="w-full flex flex-col space-y-3">
        {/* Status header: Angle, Aspect, Index */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-studio-muted bg-studio-card px-2 py-0.5 rounded border border-studio-border">
              {selectedIndex + 1} / {outputs.length}
            </span>
            <span className="text-xs text-studio-text font-heading font-medium">
              {activeOutput?.angle ? activeOutput.angle.replace(/_/g, " ") : "Studio Shot"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle Before/After Slider */}
            <button
              type="button"
              onClick={() => setShowSlider(!showSlider)}
              className={`min-h-[36px] px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                showSlider
                  ? "bg-studio-accent text-studio-bg border-studio-accent font-semibold"
                  : "bg-studio-card text-studio-muted border-studio-border"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{language === "id" ? "Bandingkan" : "Compare"}</span>
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              aria-label="Lihat layar penuh"
              className="min-h-[36px] min-w-[36px] rounded-lg border border-studio-border bg-studio-card text-studio-muted flex items-center justify-center hover:text-studio-text cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Carousel Image Container with swipe */}
        <div
          className="relative w-full aspect-square rounded-2xl overflow-hidden border border-studio-border bg-studio-card flex items-center justify-center touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {showSlider && sourceImage ? (
            <BeforeAfterSlider
              inline={true}
              sourceUrl={sourceImage.dataUrl}
              sourceLabel={language === "id" ? "Asli" : "Original"}
              generatedUrl={activeOutput.imageUrl}
              generatedLabel={language === "id" ? "Studio" : "Studio"}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeOutput.imageUrl}
              alt="Hasil foto studio produk"
              loading="lazy"
              className="w-full h-full object-contain p-2"
            />
          )}

          {/* Swipe arrows for touch guidance */}
          {outputs.length > 1 && (
            <>
              {selectedIndex > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectIndex(selectedIndex - 1)}
                  aria-label="Variasi sebelumnya"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-studio-bg/80 border border-studio-border text-studio-text flex items-center justify-center backdrop-blur-xs shadow-md"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {selectedIndex < outputs.length - 1 && (
                <button
                  type="button"
                  onClick={() => onSelectIndex(selectedIndex + 1)}
                  aria-label="Variasi berikutnya"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-studio-bg/80 border border-studio-border text-studio-text flex items-center justify-center backdrop-blur-xs shadow-md"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Variations Dots Indicator */}
        {outputs.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-1">
            {outputs.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectIndex(idx)}
                aria-label={`Pilih variasi foto ${idx + 1}`}
                className={`transition-all min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer`}
              >
                <span
                  className={`rounded-full transition-all ${
                    selectedIndex === idx
                      ? "w-6 h-2 bg-studio-accent"
                      : "w-2 h-2 bg-studio-border hover:bg-studio-muted"
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        {/* Mobile Action Buttons Bar (>= 44px touch targets) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() =>
              onDownload(
                activeOutput.imageUrl,
                activeOutput.angle || `foto-studio-${selectedIndex + 1}`
              )
            }
            className="min-h-[44px] px-3 rounded-xl border border-studio-border bg-studio-card text-studio-text hover:bg-studio-subcard flex items-center justify-center gap-2 text-xs font-semibold font-heading cursor-pointer active:scale-98"
          >
            <Download className="w-4 h-4 text-studio-accent" />
            <span>{language === "id" ? "Unduh PNG" : "Download PNG"}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onShare
                ? onShare(
                    activeOutput.imageUrl,
                    activeOutput.angle || `foto-studio-${selectedIndex + 1}`
                  )
                : onDownload(
                    activeOutput.imageUrl,
                    activeOutput.angle || `foto-studio-${selectedIndex + 1}`
                  )
            }
            className="min-h-[44px] px-3 rounded-xl border border-studio-border bg-studio-card text-studio-text hover:bg-studio-subcard flex items-center justify-center gap-2 text-xs font-semibold font-heading cursor-pointer active:scale-98"
          >
            <Share2 className="w-4 h-4 text-studio-accent" />
            <span>{language === "id" ? "Bagikan" : "Share"}</span>
          </button>
        </div>

        {/* Blueprint & Re-shoot Secondary Actions */}
        <div className="flex items-center justify-between pt-1 text-xs">
          {onOpenBlueprint && (
            <button
              type="button"
              onClick={onOpenBlueprint}
              className="min-h-[44px] px-2 text-studio-muted hover:text-studio-text flex items-center gap-1.5 cursor-pointer font-mono text-[11px]"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{language === "id" ? "Lihat Blueprint" : "Inspect Blueprint"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRegenerate}
            disabled={isGenerating}
            className="min-h-[44px] px-2 text-studio-muted hover:text-studio-text flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === "id" ? "Atur Ulang" : "Regenerate"}</span>
          </button>
        </div>

        {/* Fullscreen Modal on Mobile */}
        {isFullscreen && (
          <div
            className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4"
            onClick={() => setIsFullscreen(false)}
          >
            <div className="flex items-center justify-between pt-safe">
              <span className="text-xs font-mono text-studio-muted">
                {selectedIndex + 1} / {outputs.length}
              </span>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="min-h-[44px] min-w-[44px] rounded-lg bg-studio-card border border-studio-border text-studio-text flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center my-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeOutput.imageUrl}
                alt="Fullscreen shoot"
                className="max-h-[80dvh] max-w-full object-contain"
              />
            </div>
            <div className="pb-safe flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(activeOutput.imageUrl, "foto-studio");
                }}
                className="min-h-[44px] px-4 rounded-xl bg-studio-accent text-studio-bg font-semibold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{language === "id" ? "Unduh" : "Download"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DESKTOP VARIANT
  return (
    <div className="flex-1 flex flex-col min-h-0 max-w-4xl w-full mx-auto space-y-3">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-studio-border shrink-0">
        {/* Studio Specs Badge */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-studio-card border border-studio-border text-studio-text font-mono text-[11px] shadow-sm">
          <Camera className="w-3.5 h-3.5 text-studio-muted shrink-0" />
          <span className="text-studio-text font-medium">{resString}</span>
          <span className="text-studio-dim">•</span>
          <span className="text-studio-muted">Aspect {direction.aspectRatio}</span>
          <span className="text-studio-dim">•</span>
          <span className="text-studio-accent font-medium">
            {activeOutput.angle || "Studio Shot"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onOpenBlueprint && (
            <button
              type="button"
              onClick={onOpenBlueprint}
              aria-label="Buka Blueprint produk"
              className="btn-secondary h-8 px-3 text-xs gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5 text-studio-muted" />
              <span>Blueprint</span>
            </button>
          )}

          <button
            type="button"
            id="desktop-download-btn"
            onClick={() =>
              onDownload(
                activeOutput.imageUrl,
                activeOutput.angle || "foto-studio"
              )
            }
            aria-label="Unduh foto produk dalam format PNG"
            className="btn-primary h-8 px-3 text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{language === "id" ? "Unduh PNG" : "Download PNG"}</span>
          </button>

          <button
            type="button"
            id="desktop-regenerate-btn"
            onClick={onRegenerate}
            disabled={isGenerating}
            aria-label="Atur ulang atau buat variasi baru"
            className="btn-secondary h-8 px-3 text-xs gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-studio-muted" />
            <span>{language === "id" ? "Atur Ulang" : "Regenerate"}</span>
          </button>
        </div>
      </div>

      {/* Large Centered Before/After Slider Canvas */}
      {sourceImage && (
        <div className="flex-1 flex items-center justify-center min-h-0 my-auto py-1">
          <div className="w-full max-w-[620px] p-2 sm:p-2.5 rounded-2xl bg-studio-card border border-studio-border shadow-2xl shadow-black/60">
            <BeforeAfterSlider
              inline={true}
              sourceUrl={sourceImage.dataUrl}
              sourceLabel={language === "id" ? "Foto Asli" : "Original"}
              generatedUrl={activeOutput.imageUrl}
              generatedLabel={language === "id" ? "Hasil Studio AI" : "AI Studio"}
            />
          </div>
        </div>
      )}

      {/* Variations Dock at bottom */}
      {outputs.length > 1 && (
        <div className="flex flex-col items-center justify-center pt-2 pb-1 shrink-0">
          <div className="inline-flex items-center gap-2.5 p-1.5 rounded-xl bg-studio-card border border-studio-border shadow-lg">
            <span className="text-[10px] font-mono uppercase tracking-wider text-studio-muted pl-2 pr-1 select-none">
              {language === "id" ? "Variasi" : "Variations"}
            </span>
            <div className="flex items-center gap-2">
              {outputs.map((out, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={out.id || idx}
                    type="button"
                    onClick={() => onSelectIndex(idx)}
                    aria-label={`Pilih variasi ${idx + 1}`}
                    className={`relative w-[60px] h-[60px] rounded-lg overflow-hidden border p-0.5 bg-studio-bg transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? "border-studio-accent ring-2 ring-studio-accent ring-offset-2 ring-offset-studio-bg shadow-md"
                        : "border-studio-border hover:border-studio-muted opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={out.imageUrl}
                      alt={out.angle || `Variasi ${idx + 1}`}
                      className="w-full h-full object-contain pointer-events-none rounded"
                    />
                    <span
                      className={`absolute bottom-1 right-1 text-[9px] font-mono px-1 rounded ${
                        isSelected
                          ? "bg-studio-accent text-studio-bg font-bold"
                          : "bg-studio-card/90 text-studio-muted"
                      }`}
                    >
                      0{idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
