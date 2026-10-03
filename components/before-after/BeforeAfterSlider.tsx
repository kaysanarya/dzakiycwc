"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, Sliders } from "lucide-react";

interface BeforeAfterSliderProps {
  sourceUrl: string;
  sourceLabel?: string;
  generatedUrl: string;
  generatedLabel?: string;
  isOpen?: boolean;
  inline?: boolean;
  onClose?: () => void;
  className?: string;
}

export function BeforeAfterSlider({
  sourceUrl,
  sourceLabel = "Foto Asli",
  generatedUrl,
  generatedLabel = "Hasil Studio AI",
  isOpen = true,
  inline = false,
  onClose,
  className = "",
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!inline && !isOpen) return;
    const element = containerRef.current;
    if (!element) return;

    setContainerWidth(element.clientWidth);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isOpen, inline]);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    handleMove(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      handleMove(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      isDragging.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setSliderPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === "ArrowRight") {
      setSliderPosition((prev) => Math.min(100, prev + 5));
    }
  };

  if (!inline && !isOpen) return null;

  const sliderBody = (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={0}
      aria-label="Slider perbandingan foto sebelum dan sesudah"
      aria-valuenow={Math.round(sliderPosition)}
      aria-valuemin={0}
      aria-valuemax={100}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative w-full aspect-square max-h-[560px] rounded-xl overflow-hidden select-none cursor-ew-resize border border-studio-border bg-studio-bg touch-pan-y focus-visible:ring-2 focus-visible:ring-studio-accent ${className}`}
    >
      {/* Right: Generated Image (Base layer) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={generatedUrl}
        alt="Hasil Studio AI"
        loading="lazy"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none p-2"
      />
      <div className="absolute top-3 right-3 bg-studio-bg/90 backdrop-blur-md border border-studio-border text-studio-text text-[11px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-md shadow-md pointer-events-none select-none">
        {generatedLabel}
      </div>

      {/* Left: Source Image (Clipped layer) */}
      <div
        className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none select-none"
        style={{ width: `${sliderPosition}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sourceUrl}
          alt="Foto Asli Produk"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain p-2 max-w-none"
          style={{ width: containerWidth ? `${containerWidth}px` : "100%" }}
        />
        <div className="absolute top-3 left-3 bg-studio-bg/90 backdrop-blur-md border border-studio-border text-studio-text text-[11px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-md shadow-md pointer-events-none select-none">
          {sourceLabel}
        </div>
      </div>

      {/* Divider Line & Touch-Friendly Handle (36x36px on mobile) */}
      <div
        className="absolute inset-y-0 w-[2px] bg-white pointer-events-none shadow-[0_0_8px_rgba(255,255,255,0.4)]"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-zinc-900 border-2 border-white flex items-center justify-center text-zinc-100 shadow-xl shadow-black/80 hover:scale-105 active:scale-95 transition-transform pointer-events-none">
          <Sliders className="w-3.5 h-3.5 text-zinc-200" />
        </div>
      </div>
    </div>
  );

  if (inline) {
    return sliderBody;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card-flat w-full max-w-4xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              Perbandingan Sebelum & Sesudah
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Geser garis pemisah untuk membandingkan foto produk asli dengan hasil foto studio.
            </p>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup perbandingan"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Interactive Comparison Viewport */}
        <div className="p-6 flex flex-col items-center justify-center bg-zinc-950">
          {sliderBody}
        </div>
      </div>
    </div>
  );
}
