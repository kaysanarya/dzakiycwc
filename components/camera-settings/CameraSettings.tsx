"use client";

import React from "react";
import {
  PhotographyDirection,
  CameraAngle,
  BackgroundSetting,
  ModelSetting,
  AspectRatio,
} from "@/types";
import {
  Camera,
  Ratio,
  Sparkles,
  Check,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface CameraSettingsProps {
  direction: PhotographyDirection;
  onChangeDirection: (updated: PhotographyDirection) => void;
  activeProvider?: string;
  hideAdvancedSection?: boolean;
}

interface BackgroundPresetItem {
  id: BackgroundSetting;
  nameId: string;
  nameEn: string;
  descId: string;
  descEn: string;
  previewClass: string;
}

// Exactly 6 visual background presets with swatches
const BACKGROUND_PRESETS: BackgroundPresetItem[] = [
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
    descId: "Latar putih bersih",
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
    descId: "Gradasi gelap elegan",
    descEn: "Dark elegant gradient",
    previewClass: "bg-gradient-to-b from-zinc-700 to-zinc-900 border-zinc-600",
  },
  {
    id: "transparent",
    nameId: "Transparan",
    nameEn: "Transparent",
    descId: "PNG transparan + bayangan",
    descEn: "Transparent PNG",
    previewClass: "bg-[radial-gradient(#52525b_1px,transparent_1px)] [background-size:6px_6px] bg-zinc-900 border-zinc-700",
  },
  {
    id: "exact_reference",
    nameId: "Ikuti Referensi",
    nameEn: "Match Reference",
    descId: "Meniru tata cahaya foto",
    descEn: "Match photo lighting",
    previewClass: "bg-gradient-to-br from-blue-900 to-zinc-900 border-blue-600/50",
  },
];

const ASPECT_RATIOS: { ratio: AspectRatio; name: string; descId: string; descEn: string }[] = [
  { ratio: "1:1", name: "1:1", descId: "Persegi (Feed)", descEn: "Square" },
  { ratio: "4:5", name: "4:5", descId: "Potret (IG)", descEn: "Portrait" },
  { ratio: "9:16", name: "9:16", descId: "Vertikal (Story)", descEn: "Vertical" },
];

const CAMERA_ANGLES: { value: CameraAngle; labelId: string; labelEn: string }[] = [
  { value: "three_quarter", labelId: "3/4 Diagonal", labelEn: "3/4 Diagonal" },
  { value: "front", labelId: "Lurus Depan", labelEn: "Front" },
  { value: "side", labelId: "Samping", labelEn: "Side Profile" },
  { value: "top", labelId: "Atas (Flatlay)", labelEn: "Top Flatlay" },
  { value: "copy_reference", labelId: "Ikuti Referensi", labelEn: "Match Ref" },
];

export function CameraSettings({
  direction,
  onChangeDirection,
  activeProvider,
  hideAdvancedSection = false,
}: CameraSettingsProps) {
  const { language } = useLanguage();

  const supportsImageConditioning = activeProvider === "stability" || activeProvider === "replicate";

  return (
    <div className="space-y-4">
      {/* 1. Visual Background Presets Grid (6 presets, 2 columns on sidebar) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-zinc-300">
          {language === "id" ? "Pilihan Latar" : "Studio Backdrop"}
        </label>
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
                    ? "bg-zinc-800/90 border-zinc-500 text-zinc-100 ring-1 ring-zinc-500/80 shadow-xs"
                    : "bg-zinc-900/50 hover:bg-zinc-800/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`w-5 h-5 rounded border shadow-inner shrink-0 ${preset.previewClass}`}
                  />
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-zinc-200 stroke-[2.5]" />
                  )}
                </div>
                <div>
                  <span className={`text-xs font-semibold block truncate ${isSelected ? "text-zinc-100" : "text-zinc-300"}`}>
                    {language === "id" ? preset.nameId : preset.nameEn}
                  </span>
                  <span className="text-[10px] text-zinc-500 block truncate">
                    {language === "id" ? preset.descId : preset.descEn}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Aspect Ratio Selector (1:1, 4:5, 9:16) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
          <Ratio className="w-3.5 h-3.5 text-zinc-400" />
          <span>{language === "id" ? "Rasio Ukuran" : "Aspect Ratio"}</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {ASPECT_RATIOS.map((item) => {
            const isSelected = direction.aspectRatio === item.ratio;
            return (
              <button
                key={item.ratio}
                type="button"
                onClick={() =>
                  onChangeDirection({
                    ...direction,
                    aspectRatio: item.ratio,
                  })
                }
                className={`py-2 px-1 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  isSelected
                    ? "bg-zinc-100 text-zinc-950 font-bold border-zinc-200 shadow-xs"
                    : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border-zinc-800"
                }`}
              >
                <span className="text-xs font-mono font-bold">{item.name}</span>
                <span className={`text-[9px] truncate max-w-full font-medium ${isSelected ? "text-zinc-800" : "text-zinc-500"}`}>
                  {language === "id" ? item.descId : item.descEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional advanced controls (Camera angle & model setting) */}
      {!hideAdvancedSection && (
        <>
          {/* Camera Angle Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-zinc-400" />
              <span>{language === "id" ? "Sudut Kamera" : "Camera Angle"}</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {CAMERA_ANGLES.map((angle) => {
                const isSelected = direction.cameraAngle === angle.value;
                return (
                  <button
                    key={angle.value}
                    type="button"
                    onClick={() =>
                      onChangeDirection({
                        ...direction,
                        cameraAngle: angle.value,
                      })
                    }
                    className={`p-2 rounded-lg border text-xs font-medium text-center transition-all cursor-pointer truncate ${
                      isSelected
                        ? "bg-zinc-800 text-white border-zinc-600"
                        : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border-zinc-800"
                    }`}
                  >
                    {language === "id" ? angle.labelId : angle.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model Setting (Only if provider supports image conditioning) */}
          {supportsImageConditioning && (
            <div className="p-3 rounded-lg border border-amber-800/40 bg-amber-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === "id" ? "Tampilan Model" : "Model Setting"}</span>
                </span>
                <span className="text-[9px] font-bold text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                  {language === "id" ? "Eksperimental" : "Experimental"}
                </span>
              </div>
              <p className="text-[11px] text-amber-200/70">
                {language === "id" ? "Produk tidak dijamin identik" : "Product details not guaranteed"}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {(["without_model", "with_model"] as ModelSetting[]).map((setting) => {
                  const isSelected = (direction.modelSetting || "without_model") === setting;
                  return (
                    <button
                      key={setting}
                      type="button"
                      onClick={() => onChangeDirection({ ...direction, modelSetting: setting })}
                      className={`p-1.5 rounded text-xs font-medium border text-center transition-all ${
                        isSelected
                          ? "bg-amber-500/20 text-amber-200 border-amber-500/50"
                          : "bg-zinc-900/80 text-zinc-400 border-zinc-800"
                      }`}
                    >
                      {setting === "without_model"
                        ? language === "id" ? "Produk Saja" : "Product Only"
                        : language === "id" ? "Dipakai di kaki" : "Worn on foot"}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
