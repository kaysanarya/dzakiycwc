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
    descId: "Podium krem hangat, bayangan lembut",
    descEn: "Warm neutral podium, soft ambient shadow",
    previewClass: "bg-gradient-to-b from-[#f5efe6] to-[#e6dccd] border-[#d8ccba]",
  },
  {
    id: "studio_white",
    nameId: "Studio White",
    nameEn: "Studio White",
    descId: "Latar putih bersih tanpa pantulan",
    descEn: "Pure clean white cyclorama",
    previewClass: "bg-white border-slate-200",
  },
  {
    id: "lifestyle",
    nameId: "Lifestyle Interior",
    nameEn: "Lifestyle Interior",
    descId: "Interior batu arsitektur estetik",
    descEn: "Warm architectural limestone",
    previewClass: "bg-gradient-to-br from-[#dfd7cc] via-[#c9bfaf] to-[#b3a896] border-[#baa995]",
  },
  {
    id: "gradient",
    nameId: "Studio Gradasi",
    nameEn: "Studio Gradient",
    descId: "Gradasi studio gelap dan amber",
    descEn: "Smooth studio dark gradient",
    previewClass: "bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-slate-700",
  },
  {
    id: "transparent",
    nameId: "Transparan",
    nameEn: "Transparent",
    descId: "Latar transparan dengan bayangan lantai",
    descEn: "Transparent PNG with grounding shadow",
    previewClass: "bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:8px_8px] bg-slate-900 border-slate-700",
  },
  {
    id: "exact_reference",
    nameId: "Ikuti Referensi",
    nameEn: "Match Reference",
    descId: "Meniru tata cahaya foto referensi",
    descEn: "Replicate reference photo lighting",
    previewClass: "bg-gradient-to-br from-[#1e3a8a] via-[#1e1b4b] to-[#0f172a] border-indigo-500/50",
  },
];

const ASPECT_RATIOS: { ratio: AspectRatio; name: string; descId: string; descEn: string }[] = [
  { ratio: "1:1", name: "1:1", descId: "Persegi (Feed / Shopee)", descEn: "Square (Feed / Catalog)" },
  { ratio: "4:5", name: "4:5", descId: "Potret (Instagram)", descEn: "Portrait (Instagram)" },
  { ratio: "9:16", name: "9:16", descId: "Vertikal (Story / TikTok)", descEn: "Vertical (Story / TikTok)" },
];

const CAMERA_ANGLES: { value: CameraAngle; labelId: string; labelEn: string }[] = [
  { value: "three_quarter", labelId: "3/4 Diagonal (Hero)", labelEn: "3/4 Front Diagonal (Hero)" },
  { value: "front", labelId: "Lurus Depan", labelEn: "Straight-on Front" },
  { value: "side", labelId: "Samping (Profil)", labelEn: "Side Profile" },
  { value: "top", labelId: "Atas (Flatlay)", labelEn: "Top-Down Flatlay" },
  { value: "copy_reference", labelId: "Ikuti Sudut Referensi", labelEn: "Match Reference Angle" },
];

export function CameraSettings({
  direction,
  onChangeDirection,
  activeProvider,
}: CameraSettingsProps) {
  const { language } = useLanguage();

  // Only active when provider supports image-conditioned editing (Stability / Replicate)
  const supportsImageConditioning = activeProvider === "stability" || activeProvider === "replicate";

  return (
    <div className="space-y-4 pt-2">
      <div className="border-b border-white/[0.08] pb-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>{language === "id" ? "Kamera & Latar Studio" : "Camera & Studio Backdrop"}</span>
          </h3>
          <p className="text-xs text-white/60 mt-0.5 font-medium">
            {language === "id"
              ? "Pilih suasana latar, sudut pandang kamera, dan rasio foto katalog."
              : "Choose backdrop atmosphere, camera perspective, and catalog framing."}
          </p>
        </div>
      </div>

      {/* 1. Visual Background Presets Grid (Max 6 with thumbnails) */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-white flex items-center gap-1.5">
          <span>{language === "id" ? "Pilihan Latar Belakang (6 Preset)" : "Studio Backdrop (6 Presets)"}</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
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
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2 relative ${
                  isSelected
                    ? "bg-[#1951fc]/15 border-[#3781fc] shadow-[0_0_16px_rgba(25,81,252,0.3)] ring-1 ring-[#3781fc]"
                    : "bg-white/[0.025] hover:bg-white/[0.05] border-white/[0.08] hover:border-white/[0.18]"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  {/* Thumbnail Swatch */}
                  <div
                    className={`w-7 h-7 rounded-xl border shadow-inner shrink-0 ${preset.previewClass}`}
                  />
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#1951fc] text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {language === "id" ? preset.nameId : preset.nameEn}
                  </span>
                  <span className="text-[10px] text-white/60 block mt-0.5 leading-snug line-clamp-2 font-medium">
                    {language === "id" ? preset.descId : preset.descEn}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Aspect Ratio Selector (Strictly 1:1, 4:5, 9:16) */}
      <div className="space-y-2 pt-1">
        <label className="block text-xs font-bold text-white flex items-center gap-1.5">
          <Ratio className="w-3.5 h-3.5 text-[#3781fc]" />
          <span>{language === "id" ? "Ukuran & Rasio Foto" : "Aspect Ratio"}</span>
        </label>
        <div className="grid grid-cols-3 gap-2.5">
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
                className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? "bg-[#1951fc] text-white border-[#3781fc] shadow-[0_4px_16px_rgba(25,81,252,0.4)] scale-[1.02]"
                    : "bg-white/[0.03] text-white/80 hover:text-white border-white/[0.08] hover:bg-white/[0.06]"
                }`}
              >
                <span className="text-sm font-mono font-extrabold">{item.name}</span>
                <span className="text-[10px] opacity-80 font-medium">
                  {language === "id" ? item.descId : item.descEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Camera Angle Selector */}
      <div className="space-y-2 pt-1">
        <label className="block text-xs font-bold text-white flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-[#3781fc]" />
          <span>{language === "id" ? "Sudut Pandang Kamera" : "Camera Angle"}</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white/[0.12] text-white border-white/30 shadow-xs"
                    : "bg-white/[0.025] text-white/70 hover:text-white border-white/[0.07] hover:bg-white/[0.05]"
                }`}
              >
                {language === "id" ? angle.labelId : angle.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Opsi "Dipakai di kaki / Dipegang tangan" (Hanya muncul jika provider mendukung image conditioning) */}
      {supportsImageConditioning && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 space-y-2.5 mt-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">
              {language === "id" ? "Dipakai di Kaki / Dipegang Tangan" : "On Foot / Held in Hand"}
            </span>
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-black">
              Eksperimental
            </span>
          </div>
          <p className="text-[11px] text-amber-200/90 font-medium">
            Produk tidak dijamin identik (menggunakan model generasi AI interaktif).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {[
              { value: "without_model", labelId: "Tanpa Model (Produk Saja)", labelEn: "Without Model (Default)" },
              { value: "human_model", labelId: "Dipakai di Kaki", labelEn: "Worn on Foot" },
              { value: "partial_hands", labelId: "Dipegang di Tangan", labelEn: "Held in Hand" },
            ].map((opt) => {
              const isSelected = direction.modelSetting === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    onChangeDirection({
                      ...direction,
                      modelSetting: opt.value as ModelSetting,
                    })
                  }
                  className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#1951fc] text-white border-[#3781fc] shadow-xs"
                      : "bg-black/30 text-white/70 hover:text-white border-white/[0.08] hover:bg-black/40"
                  }`}
                >
                  {language === "id" ? opt.labelId : opt.labelEn}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
