"use client";

import React, { useState, useEffect } from "react";
import {
  PhotographyDirection,
  CameraAngle,
  BackgroundSetting,
  ModelSetting,
  MarketplacePreset,
  AspectRatio,
  HumanModelOptions,
} from "@/types";
import {
  Camera,
  Image as ImageIcon,
  User,
  ShoppingBag,
  Ratio,
  Sparkles,
  BookmarkCheck,
  Save,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface CameraSettingsProps {
  direction: PhotographyDirection;
  onChangeDirection: (updated: PhotographyDirection) => void;
}

interface SavedPreset {
  name: string;
  direction: PhotographyDirection;
}

const DEFAULT_STUDIO_PRESETS: SavedPreset[] = [
  {
    name: "Luxury Studio Beige (Default)",
    direction: {
      modelSetting: "without_model",
      cameraAngle: "three_quarter",
      background: "studio_beige",
      marketplacePreset: "shopee",
      aspectRatio: "1:1",
    },
  },
  {
    name: "Amazon Pure White Cyclorama",
    direction: {
      modelSetting: "without_model",
      cameraAngle: "front",
      background: "studio_white",
      marketplacePreset: "amazon",
      aspectRatio: "1:1",
    },
  },
  {
    name: "Editorial Lifestyle Portrait",
    direction: {
      modelSetting: "human_model",
      modelOptions: {
        genderPresentation: "female",
        pose: "standing",
        bodyFraming: "feet_only",
        clothingStyle: "minimalist_monochrome",
        skinVisibility: "natural",
        productPlacement: "on_foot",
      },
      cameraAngle: "three_quarter",
      background: "lifestyle",
      marketplacePreset: "instagram",
      aspectRatio: "4:5",
    },
  },
];

const MARKETPLACE_CONFIGS: Record<
  MarketplacePreset,
  { name: string; ratio: AspectRatio; scale: string; margin: string; desc: string }
> = {
  shopee: {
    name: "Shopee (1:1)",
    ratio: "1:1",
    scale: "80-85% frame coverage",
    margin: "10% safe perimeter padding",
    desc: "Clean product emphasis optimized for mobile feed grid & zoom preview.",
  },
  tokopedia: {
    name: "Tokopedia (1:1)",
    ratio: "1:1",
    scale: "85% hero focus",
    margin: "8% safe zone",
    desc: "Crisp neutral studio contrast compliant with official seller tier guidelines.",
  },
  tiktok_shop: {
    name: "TikTok Shop (9:16)",
    ratio: "9:16",
    scale: "Centered vertical elevation",
    margin: "15% UI overlay safe bottom/right",
    desc: "Vertical immersion format with safe zones avoiding shopping bag button overlap.",
  },
  instagram: {
    name: "Instagram Shop / Feed (4:5)",
    ratio: "4:5",
    scale: "75% editorial framing",
    margin: "12% breathing room",
    desc: "Editorial lifestyle aesthetic optimized for portrait scroll engagement.",
  },
  amazon: {
    name: "Amazon (1:1)",
    ratio: "1:1",
    scale: "85% minimum product fill",
    margin: "Strict pure white 255/255/255 compliant",
    desc: "High-key pure white cyclorama with zero extraneous prop elements.",
  },
  general: {
    name: "General E-commerce (1:1)",
    ratio: "1:1",
    scale: "Balanced 80% commercial framing",
    margin: "Standard 10% margins",
    desc: "Universal premium catalog standard suitable across modern storefronts.",
  },
  custom: {
    name: "Custom Framing",
    ratio: "1:1",
    scale: "User customized",
    margin: "Dynamic",
    desc: "Freely combine camera angles, backdrops, and ratios.",
  },
};

export function CameraSettings({
  direction,
  onChangeDirection,
}: CameraSettingsProps) {
  const { language } = useLanguage();

  // Studio Presets State (Requirement 5)
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>(DEFAULT_STUDIO_PRESETS);
  const [newPresetName, setNewPresetName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [activePresetName, setActivePresetName] = useState<string>("Luxury Studio Beige (Default)");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("vellum_studio_presets");
      if (stored) {
        setSavedPresets(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors in restricted environments
    }
  }, []);

  const handleSaveCurrentPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: SavedPreset = {
      name: newPresetName.trim(),
      direction: { ...direction },
    };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    setActivePresetName(newPreset.name);
    try {
      localStorage.setItem("vellum_studio_presets", JSON.stringify(updated));
    } catch {
      // Ignore
    }
    setNewPresetName("");
    setShowSaveModal(false);
  };

  const handleLoadPreset = (name: string) => {
    setActivePresetName(name);
    const target = savedPresets.find((p) => p.name === name);
    if (target) {
      onChangeDirection({ ...target.direction });
    }
  };

  const handleMarketplaceChange = (preset: MarketplacePreset) => {
    const config = MARKETPLACE_CONFIGS[preset];
    onChangeDirection({
      ...direction,
      marketplacePreset: preset,
      aspectRatio: config.ratio,
      background: preset === "amazon" ? "studio_white" : direction.background,
    });
  };

  const handleModelOptionsChange = (
    field: keyof HumanModelOptions,
    value: string
  ) => {
    const currentOptions: HumanModelOptions = direction.modelOptions || {
      genderPresentation: "female",
      pose: "standing",
      bodyFraming: "feet_only",
      clothingStyle: "minimalist_monochrome",
      skinVisibility: "natural",
      productPlacement: "on_foot",
    };

    onChangeDirection({
      ...direction,
      modelOptions: {
        ...currentOptions,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="border-b border-white/[0.08] pb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight uppercase flex items-center gap-2">
            <span>{language === "id" ? "Kamera & Lingkungan" : "Camera & Environment"}</span>
          </h3>
          <p className="text-xs text-white/70 mt-0.5 font-medium">
            {language === "id"
              ? "Atur sudut pandang kamera, latar belakang studio, preset marketplace, dan model manusia."
              : "Direct the photography session atmosphere, camera angles, backdrops, and model presence."}
          </p>
        </div>

        {/* Save as Studio Preset Action Button */}
        <button
          type="button"
          onClick={() => setShowSaveModal(true)}
          className="liquid-glass-btn px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/[0.05] hover:bg-[#1951fc]/20 text-white border border-white/10 hover:border-[#3781fc]/50 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          title="Simpan kombinasi Kamera, Background, dan Style ini sebagai preset"
        >
          <Save className="w-3.5 h-3.5 text-[#3781fc]" />
          <span>{language === "id" ? "Simpan Studio Preset" : "Save as Studio Preset"}</span>
        </button>
      </div>

      {/* Preset Selector Bar */}
      <div className="p-3.5 rounded-2xl liquid-glass-subcard flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border border-white/[0.08] shadow-inner">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#1951fc]/15 border border-[#3781fc]/30 flex items-center justify-center text-[#3781fc] shrink-0">
            <BookmarkCheck className="w-4 h-4" />
          </div>
          <span className="font-bold text-white tracking-wide">Studio Preset:</span>
          <select
            value={activePresetName}
            onChange={(e) => handleLoadPreset(e.target.value)}
            className="text-xs font-semibold text-white bg-[#0a0d18] border border-white/[0.12] px-3 py-1.5 focus:border-[#3781fc] focus:outline-none focus:ring-1 focus:ring-[#3781fc] cursor-pointer rounded-xl shadow-inner"
          >
            {savedPresets.map((p) => (
              <option key={p.name} value={p.name} className="bg-[#0c101d] text-slate-100 py-1.5">
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-white/70 font-medium">
          *Gunakan preset untuk konsistensi katalog produk lain.
        </span>
      </div>

      {/* Save Preset Inline Modal */}
      {showSaveModal && (
        <div className="p-4 rounded-2xl bg-[#0c101d] border border-[#3781fc]/40 shadow-xl space-y-3">
          <p className="text-xs font-bold text-white">
            {language === "id" ? "Simpan Kombinasi Saat Ini Sebagai Preset Baru:" : "Save Current Setup as Studio Preset:"}
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder={language === "id" ? "Contoh: Sandal Gold Katalog Shopee" : "e.g., Luxury Gold Preset"}
              className="flex-1 text-xs px-3.5 py-2 bg-[#060810] text-white border border-white/[0.12] rounded-xl focus:border-[#3781fc] focus:outline-none focus:ring-1 focus:ring-[#3781fc]"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSaveCurrentPreset}
              className="px-4 py-2 rounded-xl bg-[#1951fc] hover:bg-[#1447db] text-white text-xs font-bold cursor-pointer transition-colors shadow-sm"
            >
              Simpan
            </button>
            <button
              type="button"
              onClick={() => setShowSaveModal(false)}
              className="px-4 py-2 rounded-xl text-white/70 hover:text-white text-xs font-medium hover:bg-white/[0.05] cursor-pointer border border-white/[0.08] transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* 2x2 Settings Grid with Anti-AI Slop Craftsmanship */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Model Setting */}
        <div className="p-3.5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] transition-all space-y-2">
          <label className="block text-xs font-bold text-white flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#1951fc]/15 border border-[#3781fc]/30 flex items-center justify-center text-[#3781fc] shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <span>{language === "id" ? "Penggunaan Model" : "Model Setting"}</span>
          </label>
          <select
            value={direction.modelSetting}
            onChange={(e) =>
              onChangeDirection({
                ...direction,
                modelSetting: e.target.value as ModelSetting,
              })
            }
            className="w-full text-xs font-semibold text-white bg-[#0a0d18] border border-white/[0.12] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#3781fc] focus:ring-1 focus:ring-[#3781fc] cursor-pointer shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] transition-all"
          >
            <option value="without_model" className="bg-[#0c101d] text-slate-100 py-1.5">Tanpa Model (Default - Produk Saja)</option>
            <option value="human_model" className="bg-[#0c101d] text-slate-100 py-1.5">Model Manusia (Editorial Fashion)</option>
            <option value="partial_hands" className="bg-[#0c101d] text-slate-100 py-1.5">Tangan / Partial Model Framing</option>
            <option value="custom" className="bg-[#0c101d] text-slate-100 py-1.5">Custom Styling</option>
          </select>
        </div>

        {/* Camera Angle */}
        <div className="p-3.5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] transition-all space-y-2">
          <label className="block text-xs font-bold text-white flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#1951fc]/15 border border-[#3781fc]/30 flex items-center justify-center text-[#3781fc] shrink-0">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <span>{language === "id" ? "Camera Angle" : "Camera Angle"}</span>
          </label>
          <select
            value={direction.cameraAngle}
            onChange={(e) =>
              onChangeDirection({
                ...direction,
                cameraAngle: e.target.value as CameraAngle,
              })
            }
            className="w-full text-xs font-semibold text-white bg-[#0a0d18] border border-white/[0.12] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#3781fc] focus:ring-1 focus:ring-[#3781fc] cursor-pointer shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] transition-all"
          >
            <option value="copy_reference" className="bg-[#0c101d] text-slate-100 py-1.5">Copy Reference (Default - Ikuti Referensi)</option>
            <option value="front" className="bg-[#0c101d] text-slate-100 py-1.5">Front (Lurus Depan Eye-Level)</option>
            <option value="three_quarter" className="bg-[#0c101d] text-slate-100 py-1.5">3/4 Front (Hero Diagonal Tiga Perempat)</option>
            <option value="side" className="bg-[#0c101d] text-slate-100 py-1.5">Side (Profil Samping Penuh)</option>
            <option value="top" className="bg-[#0c101d] text-slate-100 py-1.5">Top (Top-Down Flatlay / 45°)</option>
            <option value="low_angle" className="bg-[#0c101d] text-slate-100 py-1.5">Low Angle (Sudut Rendah Dramatis)</option>
            <option value="high_angle" className="bg-[#0c101d] text-slate-100 py-1.5">High Angle (Overhead Tingkat Tinggi)</option>
            <option value="macro_detail" className="bg-[#0c101d] text-slate-100 py-1.5">Macro Detail (Detail Dekat Hardware & Tekstur)</option>
            <option value="custom" className="bg-[#0c101d] text-slate-100 py-1.5">Custom Angle...</option>
          </select>
        </div>

        {/* Background Mode */}
        <div className="p-3.5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] transition-all space-y-2">
          <label className="block text-xs font-bold text-white flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#1951fc]/15 border border-[#3781fc]/30 flex items-center justify-center text-[#3781fc] shrink-0">
              <ImageIcon className="w-3.5 h-3.5" />
            </div>
            <span>{language === "id" ? "Background Mode" : "Background Mode"}</span>
          </label>
          <select
            value={direction.background}
            onChange={(e) =>
              onChangeDirection({
                ...direction,
                background: e.target.value as BackgroundSetting,
              })
            }
            className="w-full text-xs font-semibold text-white bg-[#0a0d18] border border-white/[0.12] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#3781fc] focus:ring-1 focus:ring-[#3781fc] cursor-pointer shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] transition-all"
          >
            <option value="studio_beige" className="bg-[#0c101d] text-slate-100 py-1.5">Studio Beige (Warm Neutral Podium - Default)</option>
            <option value="studio_white" className="bg-[#0c101d] text-slate-100 py-1.5">Studio White (Komersial Pure White Cyclorama)</option>
            <option value="exact_reference" className="bg-[#0c101d] text-slate-100 py-1.5">Exact Reference (Lighting + Struktur Referensi)</option>
            <option value="similar_reference" className="bg-[#0c101d] text-slate-100 py-1.5">Similar to Reference (Suasana Mirip Referensi)</option>
            <option value="gradient" className="bg-[#0c101d] text-slate-100 py-1.5">Gradient (Gradasi Halus Studio)</option>
            <option value="transparent" className="bg-[#0c101d] text-slate-100 py-1.5">Transparent (Transparan dengan Bayangan Lantai)</option>
            <option value="lifestyle" className="bg-[#0c101d] text-slate-100 py-1.5">Lifestyle (Interior Arsitektur Estetik)</option>
            <option value="custom" className="bg-[#0c101d] text-slate-100 py-1.5">Custom Studio...</option>
          </select>
        </div>

        {/* Marketplace Preset */}
        <div className="p-3.5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] transition-all space-y-2">
          <label className="block text-xs font-bold text-white flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#1951fc]/15 border border-[#3781fc]/30 flex items-center justify-center text-[#3781fc] shrink-0">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
            <span>{language === "id" ? "Marketplace Preset (Framing & Crop)" : "Marketplace Preset"}</span>
          </label>
          <select
            value={direction.marketplacePreset}
            onChange={(e) =>
              handleMarketplaceChange(e.target.value as MarketplacePreset)
            }
            className="w-full text-xs font-semibold text-white bg-[#0a0d18] border border-white/[0.12] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#3781fc] focus:ring-1 focus:ring-[#3781fc] cursor-pointer shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] transition-all"
          >
            <option value="shopee" className="bg-[#0c101d] text-slate-100 py-1.5">Shopee (1:1 - 85% Fill Area Produk)</option>
            <option value="tokopedia" className="bg-[#0c101d] text-slate-100 py-1.5">Tokopedia (1:1 - Studio Bersih & Kontras)</option>
            <option value="tiktok_shop" className="bg-[#0c101d] text-slate-100 py-1.5">TikTok Shop (9:16 - Vertikal dengan Safe Zone Tombol)</option>
            <option value="instagram" className="bg-[#0c101d] text-slate-100 py-1.5">Instagram (4:5 - Portrait Editorial)</option>
            <option value="amazon" className="bg-[#0c101d] text-slate-100 py-1.5">Amazon (1:1 - Pure White 255/255/255)</option>
            <option value="custom" className="bg-[#0c101d] text-slate-100 py-1.5">Custom...</option>
          </select>
        </div>
      </div>

      {/* Preset Spec Badges */}
      <div className="p-4 liquid-glass-subcard rounded-2xl border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-bold text-white text-xs">
            {MARKETPLACE_CONFIGS[direction.marketplacePreset].name} Spec:
          </span>
          <span className="px-3 py-1 rounded-full bg-[#1951fc]/20 border border-[#3781fc]/40 text-[#60a5fa] font-bold text-xs shadow-xs">
            {direction.aspectRatio} Aspect Ratio
          </span>
          <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white font-semibold text-xs">
            {MARKETPLACE_CONFIGS[direction.marketplacePreset].scale}
          </span>
        </div>
        <span className="text-xs text-white/70 font-medium">
          *Disesuaikan dengan standar resmi framing katalog e-commerce.
        </span>
      </div>

      {/* Aspect Ratio Selector (Refined Professional Segmented Control) */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-white flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#1951fc]/15 border border-[#3781fc]/30 flex items-center justify-center text-[#3781fc] shrink-0">
            <Ratio className="w-3.5 h-3.5" />
          </div>
          <span>Aspect Ratio Selector</span>
        </label>
        <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
          {(["1:1", "4:5", "3:4", "16:9", "9:16"] as AspectRatio[]).map((ratio) => {
            const isSelected = direction.aspectRatio === ratio;
            const ratioLabel =
              ratio === "1:1"
                ? "Square (1:1)"
                : ratio === "4:5"
                ? "Portrait (4:5)"
                : ratio === "3:4"
                ? "Catalog (3:4)"
                : ratio === "16:9"
                ? "Wide (16:9)"
                : "Vertical (9:16)";
            return (
              <button
                key={ratio}
                type="button"
                onClick={() => onChangeDirection({ ...direction, aspectRatio: ratio })}
                className={`py-2.5 px-1 sm:px-2 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? "bg-[#1951fc] text-white border-[#3781fc] shadow-[0_4px_16px_rgba(25,81,252,0.45)] ring-1 ring-[#3781fc] scale-[1.02]"
                    : "bg-white/[0.04] text-white/80 hover:text-white border-white/[0.08] hover:border-white/20 hover:bg-white/[0.08]"
                }`}
              >
                <span className="text-xs font-mono font-bold tracking-wide">{ratio}</span>
                <span className="text-[10px] opacity-75 font-medium truncate max-w-full">
                  {ratio === "1:1" ? "Default" : ratio === "4:5" ? "IG Feed" : ratio === "3:4" ? "Standard" : ratio === "16:9" ? "Banner" : "Story/Reel"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Detail Sub-Controls (shown when Model Manusia is active, Requirement 5) */}
      {direction.modelSetting === "human_model" && (
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-amber-400/40 space-y-3 mt-2 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Opsi Tambahan Model Manusia (Gender, Pose, Clothing)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-white mb-1">
                Gender Model
              </label>
              <select
                value={direction.modelOptions?.genderPresentation || "female"}
                onChange={(e) =>
                  handleModelOptionsChange("genderPresentation", e.target.value)
                }
                className="w-full text-[11px] bg-[#0c101d] text-white border border-white/[0.12] rounded-lg p-2 font-medium focus:outline-none focus:border-[#3781fc] cursor-pointer"
              >
                <option value="female" className="bg-[#0c101d] text-white">Wanita (Female)</option>
                <option value="male" className="bg-[#0c101d] text-white">Pria (Male)</option>
                <option value="androgynous" className="bg-[#0c101d] text-white">Androgini / Netral</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white mb-1">
                Pose & Framing
              </label>
              <select
                value={direction.modelOptions?.bodyFraming || "feet_only"}
                onChange={(e) =>
                  handleModelOptionsChange("bodyFraming", e.target.value)
                }
                className="w-full text-[11px] bg-[#0c101d] text-white border border-white/[0.12] rounded-lg p-2 font-medium focus:outline-none focus:border-[#3781fc] cursor-pointer"
              >
                <option value="feet_only" className="bg-[#0c101d] text-white">Kaki Saja (Feet / Shoes Only)</option>
                <option value="lower_legs" className="bg-[#0c101d] text-white">Kaki Bawah (Lower Legs / Shin)</option>
                <option value="mid_shot" className="bg-[#0c101d] text-white">Mid-Shot (Setengah Badan)</option>
                <option value="full_body" className="bg-[#0c101d] text-white">Full Body Fashion Editorial</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white mb-1">
                Gaya Pakaian (Clothing)
              </label>
              <select
                value={direction.modelOptions?.clothingStyle || "minimalist_monochrome"}
                onChange={(e) =>
                  handleModelOptionsChange("clothingStyle", e.target.value)
                }
                className="w-full text-[11px] bg-[#0c101d] text-white border border-white/[0.12] rounded-lg p-2 font-medium focus:outline-none focus:border-[#3781fc] cursor-pointer"
              >
                <option value="minimalist_monochrome" className="bg-[#0c101d] text-white">Minimalis Monokrom</option>
                <option value="casual_chic" className="bg-[#0c101d] text-white">Casual Chic</option>
                <option value="formal_luxury" className="bg-[#0c101d] text-white">Formal Luxury</option>
                <option value="streetwear" className="bg-[#0c101d] text-white">Urban Streetwear</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
