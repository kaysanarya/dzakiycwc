"use client";

import React, { useState } from "react";
import { BackgroundSetting, PhotographyDirection } from "@/types";
import { Check, X, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface BackgroundPresetItem {
  id: BackgroundSetting;
  nameId: string;
  nameEn: string;
  descId: string;
  descEn: string;
  previewClass: string;
}

export const BACKGROUND_PRESETS: BackgroundPresetItem[] = [
  {
    id: "studio_beige",
    nameId: "Studio Beige",
    nameEn: "Studio Beige",
    descId: "Podium krem, bayangan lembut",
    descEn: "Warm neutral podium",
    previewClass: "bg-[#e8decb] border-[#d4c6af]",
  },
  {
    id: "studio_white",
    nameId: "Studio White",
    nameEn: "Studio White",
    descId: "Latar putih bersih tanpa pantulan",
    descEn: "Pure clean white",
    previewClass: "bg-white border-zinc-300",
  },
  {
    id: "lifestyle",
    nameId: "Lifestyle",
    nameEn: "Lifestyle",
    descId: "Batu arsitektur minimalis",
    descEn: "Architectural stone",
    previewClass: "bg-gradient-to-br from-[#c9bfaf] to-[#9c8e79] border-zinc-600",
  },
  {
    id: "gradient",
    nameId: "Gradasi Studio",
    nameEn: "Studio Gradient",
    descId: "Gradasi gelap netral elegan",
    descEn: "Dark elegant gradient",
    previewClass: "bg-gradient-to-b from-zinc-700 to-zinc-900 border-zinc-600",
  },
  {
    id: "transparent",
    nameId: "Transparan",
    nameEn: "Transparent",
    descId: "PNG transparan + bayangan",
    descEn: "Transparent PNG",
    previewClass:
      "bg-[radial-gradient(#52525b_1px,transparent_1px)] [background-size:6px_6px] bg-zinc-900 border-zinc-700",
  },
  {
    id: "exact_reference",
    nameId: "Ikuti Referensi",
    nameEn: "Match Reference",
    descId: "Meniru tata cahaya foto referensi",
    descEn: "Match photo lighting",
    previewClass: "bg-gradient-to-br from-amber-700/60 to-zinc-900 border-amber-600/50",
  },
];

interface PresetPickerProps {
  direction: PhotographyDirection;
  onChangeDirection: (updated: PhotographyDirection) => void;
  variant?: "desktop" | "mobile";
  onCloseSheet?: () => void;
}

export function PresetPicker({
  direction,
  onChangeDirection,
  variant = "desktop",
  onCloseSheet,
}: PresetPickerProps) {
  const { language } = useLanguage();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const selectedPreset =
    BACKGROUND_PRESETS.find((p) => p.id === direction.background) ||
    BACKGROUND_PRESETS[0];

  // Mobile sheet view
  if (variant === "mobile") {
    return (
      <div className="w-full">
        {/* Mobile Trigger Button (Target >= 48px) */}
        <button
          type="button"
          onClick={() => setIsSheetOpen(true)}
          className="w-full min-h-[50px] p-3 rounded-xl border border-studio-border bg-studio-card flex items-center justify-between text-left active:bg-studio-subcard transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-7 h-7 rounded-lg border shadow-inner shrink-0 ${selectedPreset.previewClass}`}
            />
            <div>
              <span className="text-[11px] uppercase tracking-wider text-studio-muted block font-mono">
                {language === "id" ? "Gaya Latar" : "Studio Backdrop"}
              </span>
              <span className="text-sm font-semibold text-studio-text block font-heading">
                {language === "id" ? selectedPreset.nameId : selectedPreset.nameEn}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-studio-accent font-medium text-xs">
            <span className="hidden xs:inline">
              {language === "id" ? "Ubah" : "Change"}
            </span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        {/* Mobile Bottom Sheet */}
        {isSheetOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex flex-col justify-end"
            onClick={() => setIsSheetOpen(false)}
          >
            <div
              className="w-full max-h-[85dvh] bg-studio-bg border-t border-studio-border rounded-t-2xl flex flex-col overflow-hidden pb-safe animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet Drag Indicator & Header */}
              <div className="pt-3 pb-2 px-5 flex flex-col items-center border-b border-studio-border bg-studio-card">
                <div className="w-10 h-1 rounded-full bg-studio-border mb-3" />
                <div className="w-full flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-studio-text font-heading">
                      {language === "id" ? "Pilih Gaya Latar Studio" : "Select Studio Backdrop"}
                    </h3>
                    <p className="text-xs text-studio-muted mt-0.5">
                      {language === "id"
                        ? "Pencahayaan presisi yang menonjolkan produk asli"
                        : "Calibrated lighting highlighting the authentic product"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSheetOpen(false)}
                    aria-label="Tutup pilihan latar"
                    className="p-2 rounded-lg text-studio-muted hover:text-studio-text bg-studio-subcard border border-studio-border cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Presets List */}
              <div className="overflow-y-auto p-4 space-y-2.5 max-h-[60dvh]">
                {BACKGROUND_PRESETS.map((preset) => {
                  const isSelected = direction.background === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        onChangeDirection({
                          ...direction,
                          background: preset.id,
                        });
                        setIsSheetOpen(false);
                        onCloseSheet?.();
                      }}
                      className={`w-full min-h-[54px] p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-studio-subcard border-studio-accent ring-1 ring-studio-accent"
                          : "bg-studio-card/80 hover:bg-studio-subcard border-studio-border text-studio-muted"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg border shadow-inner shrink-0 ${preset.previewClass}`}
                        />
                        <div>
                          <span
                            className={`text-sm font-semibold block font-heading ${
                              isSelected ? "text-studio-text" : "text-studio-text/90"
                            }`}
                          >
                            {language === "id" ? preset.nameId : preset.nameEn}
                          </span>
                          <span className="text-xs text-studio-muted block">
                            {language === "id" ? preset.descId : preset.descEn}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-studio-accent flex items-center justify-center text-studio-bg shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
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

  // Desktop view: Clean, high-density grid in left sidebar
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-studio-text flex items-center gap-1.5 font-heading">
          <SlidersHorizontal className="w-3.5 h-3.5 text-studio-muted" />
          <span>{language === "id" ? "Pilihan Latar Studio" : "Studio Backdrop"}</span>
        </label>
        <span className="text-[10px] font-mono text-studio-dim uppercase">
          {selectedPreset.id}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {BACKGROUND_PRESETS.map((preset) => {
          const isSelected = direction.background === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() =>
                onChangeDirection({
                  ...direction,
                  background: preset.id,
                })
              }
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                isSelected
                  ? "bg-studio-subcard border-studio-accent text-studio-text ring-1 ring-studio-accent/70 shadow-xs"
                  : "bg-studio-card/60 hover:bg-studio-subcard border-studio-border text-studio-muted hover:text-studio-text"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-5 h-5 rounded border shadow-inner shrink-0 ${preset.previewClass}`}
                />
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-studio-accent stroke-[2.5]" />
                )}
              </div>
              <div>
                <span
                  className={`text-xs font-semibold block truncate font-heading ${
                    isSelected ? "text-studio-text" : "text-studio-text/80"
                  }`}
                >
                  {language === "id" ? preset.nameId : preset.nameEn}
                </span>
                <span className="text-[10px] text-studio-dim block truncate">
                  {language === "id" ? preset.descId : preset.descEn}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
