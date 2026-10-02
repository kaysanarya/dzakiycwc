"use client";

import React, { useState, useRef, useCallback } from "react";
import { X, Sliders, SplitSquareVertical } from "lucide-react";

interface BeforeAfterSliderProps {
  sourceUrl: string;
  sourceLabel?: string;
  generatedUrl: string;
  generatedLabel?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BeforeAfterSlider({
  sourceUrl,
  sourceLabel = "Original Raw Product",
  generatedUrl,
  generatedLabel = "VELLUM Directed Studio Photo",
  isOpen,
  onClose,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      handleMove(e.clientX);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0c101d] border border-[#3781fc]/30 rounded-3xl w-full max-w-4xl flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.03] backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#1951fc]/15 border border-[#3781fc]/30 flex items-center justify-center text-[#3781fc] shrink-0">
                <SplitSquareVertical className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Visual Identity Verification Slider
              </h3>
            </div>
            <p className="text-xs text-white/60 mt-1 font-medium">
              Drag the divider to compare the raw physical product against the directed studio output.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Comparison Viewport */}
        <div className="p-6 flex flex-col items-center justify-center bg-[#07090f]">
          <div
            ref={containerRef}
            className="relative w-full aspect-square max-w-xl rounded-2xl overflow-hidden shadow-2xl select-none cursor-ew-resize border border-white/10 bg-[#0a0d18]"
            onMouseDown={(e) => {
              isDragging.current = true;
              handleMove(e.clientX);
            }}
            onMouseUp={() => (isDragging.current = false)}
            onMouseLeave={() => (isDragging.current = false)}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
          >
            {/* Right: Generated Image (Base layer) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={generatedUrl}
              alt="Generated Studio Result"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none p-2"
            />
            <div className="absolute top-3 right-3 bg-black/75 border border-white/20 text-white text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-lg backdrop-blur-md shadow-xs">
              {generatedLabel}
            </div>

            {/* Left: Source Image (Clipped layer) */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPosition}%` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sourceUrl}
                alt="Original Source Product"
                className="absolute inset-0 w-full h-full object-contain p-2 max-w-none"
                style={{ width: containerRef.current?.clientWidth || "100%" }}
              />
              <div className="absolute top-3 left-3 bg-[#1951fc]/85 border border-[#3781fc]/40 text-white text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-lg backdrop-blur-md shadow-xs">
                {sourceLabel}
              </div>
            </div>

            {/* Divider Line & Handle */}
            <div
              className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(55,129,252,0.9)] pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#1951fc] border-2 border-white flex items-center justify-center shadow-lg text-white">
                <Sliders className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Quick Slider Range Fallback */}
          <div className="w-full max-w-xl mt-4 flex items-center gap-3">
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Source</span>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#1951fc]"
            />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">Generated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
