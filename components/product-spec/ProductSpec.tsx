"use client";

import React, { useState } from "react";
import { ProductCategory, FootwearHeelSpecs } from "@/types";
import { ShieldCheck, Layers, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ProductSpecProps {
  category: ProductCategory;
  onChangeCategory: (category: ProductCategory) => void;
  heelSpecs: FootwearHeelSpecs;
  onChangeHeelSpecs: (specs: FootwearHeelSpecs) => void;
  strictProductMode: boolean;
  onToggleStrictMode: (val: boolean) => void;
  ignoreProductDesignFromReference: boolean;
  onToggleIgnoreRefDesign: (val: boolean) => void;
}

const PRESET_HEEL_HEIGHTS = [
  { label: "0 cm (Flat)", value: "0 cm" },
  { label: "1 cm", value: "1 cm" },
  { label: "2 cm", value: "2 cm" },
  { label: "3 cm", value: "3 cm" },
  { label: "4 cm", value: "4 cm" },
  { label: "5 cm", value: "5 cm" },
  { label: "Custom...", value: "custom" },
];

export function ProductSpec({
  category,
  onChangeCategory,
  heelSpecs,
  onChangeHeelSpecs,
  strictProductMode,
  onToggleStrictMode,
  ignoreProductDesignFromReference,
  onToggleIgnoreRefDesign,
}: ProductSpecProps) {
  const { t, language } = useLanguage();
  const isFootwear = category === "footwear";

  const currentHeight = heelSpecs.heelHeight || "5 cm";
  const isCustomHeight = !PRESET_HEEL_HEIGHTS.some(
    (h) => h.value !== "custom" && h.value === currentHeight
  );

  const [customInputValue, setCustomInputValue] = useState(
    isCustomHeight ? currentHeight : ""
  );

  const handleSelectHeight = (val: string) => {
    if (val === "custom") {
      onChangeHeelSpecs({
        ...heelSpecs,
        heelHeight: customInputValue || "6 cm",
      });
    } else {
      onChangeHeelSpecs({
        ...heelSpecs,
        heelHeight: val,
      });
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Section Header with SOURCE OF TRUTH Badge */}
      <div className="border-b border-white/[0.06] pb-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight uppercase flex items-center gap-2">
            <span>{language === "id" ? "Spesifikasi Fisik Produk" : "Physical Product Specification"}</span>
            <span className="text-[10px] font-extrabold tracking-wider text-[#3781fc] bg-[#1951fc]/20 px-2.5 py-0.5 rounded-full border border-[#3781fc]/40">
              SOURCE OF TRUTH
            </span>
          </h3>
          <p className="text-xs text-white/70 mt-0.5 font-medium">
            {language === "id"
              ? "Tetapkan domain produk dan batasan struktural untuk mempertahankan identitas desain asli."
              : "Define core product domain and structural preservation parameters."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Category Selector */}
        <div>
          <label className="block text-xs font-bold text-white mb-1">
            {t.productSpec.productCategory}
          </label>
          <select
            value={category}
            onChange={(e) => onChangeCategory(e.target.value as ProductCategory)}
            className="liquid-glass-input w-full text-xs font-semibold text-white bg-white/[0.05] border border-white/[0.08] px-3 py-2.5 focus:outline-none focus:border-[#3781fc] cursor-pointer shadow-xs"
          >
            <option value="footwear" className="bg-[#03195b] text-white">{t.productSpec.catFootwear}</option>
            <option value="handbags" className="bg-[#03195b] text-white">{t.productSpec.catHandbags}</option>
            <option value="apparel" className="bg-[#03195b] text-white">{t.productSpec.catApparel}</option>
            <option value="jewelry" className="bg-[#03195b] text-white">{t.productSpec.catJewelry}</option>
            <option value="cosmetics" className="bg-[#03195b] text-white">{t.productSpec.catCosmetics}</option>
            <option value="electronics" className="bg-[#03195b] text-white">{t.productSpec.catElectronics}</option>
            <option value="furniture" className="bg-[#03195b] text-white">{t.productSpec.catFurniture}</option>
            <option value="accessories" className="bg-[#03195b] text-white">{t.productSpec.catAccessories}</option>
            <option value="custom" className="bg-[#03195b] text-white">{t.productSpec.catCustom}</option>
          </select>
        </div>

        {/* Footwear Specific: Heel Height Dropdown & Priority */}
        {isFootwear ? (
          <div>
            <label className="block text-xs font-bold text-white mb-1">
              {language === "id" ? "Tinggi Hak (Heel Height)" : "Heel Height"}
            </label>
            <select
              value={isCustomHeight ? "custom" : currentHeight}
              onChange={(e) => handleSelectHeight(e.target.value)}
              className="liquid-glass-input w-full text-xs font-semibold text-white bg-white/[0.05] border border-white/[0.08] px-3 py-2.5 focus:outline-none focus:border-[#3781fc] cursor-pointer shadow-xs"
            >
              {PRESET_HEEL_HEIGHTS.map((h) => (
                <option key={h.value} value={h.value} className="bg-[#03195b] text-white">
                  {h.label}
                </option>
              ))}
            </select>

            {isCustomHeight && (
              <input
                type="text"
                value={customInputValue}
                onChange={(e) => {
                  setCustomInputValue(e.target.value);
                  onChangeHeelSpecs({
                    ...heelSpecs,
                    heelHeight: e.target.value,
                  });
                }}
                placeholder="misal: 7.5 cm / 85 mm"
                className="liquid-glass-input w-full mt-2 text-xs font-semibold text-white bg-white/[0.05] border border-white/[0.08] px-3 py-2 focus:outline-none focus:border-[#3781fc] shadow-xs"
              />
            )}
          </div>
        ) : (
          <div className="flex items-end">
            <span className="text-[11px] text-white/80 bg-white/[0.04] backdrop-blur-xs px-3 py-2.5 rounded-xl border border-white/[0.08] w-full font-medium">
              {t.productSpec.standardModel} {category}.
            </span>
          </div>
        )}
      </div>

      {/* Footwear Specific: Heel Height Priority */}
      {isFootwear && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-white mb-1">
              {language === "id" ? "Prioritas Tinggi Hak (Heel Height Priority)" : "Heel Height Priority"}
            </label>
            <select
              value={heelSpecs.heelHeightPriority || "both"}
              onChange={(e) =>
                onChangeHeelSpecs({
                  ...heelSpecs,
                  heelHeightPriority: e.target.value as "both" | "product_only" | "reference_only",
                })
              }
              className="liquid-glass-input w-full text-xs font-semibold text-white bg-white/[0.05] border border-white/[0.08] px-3 py-2.5 focus:outline-none focus:border-[#3781fc] cursor-pointer shadow-xs"
            >
              <option value="both" className="bg-[#03195b] text-white">Both - Recommended (Produk & Referensi Seimbang)</option>
              <option value="product_only" className="bg-[#03195b] text-white">Product Only (Ketat Mengikuti Produk Mentahan)</option>
              <option value="reference_only" className="bg-[#03195b] text-white">Reference Only (Ikuti Mood Referensi)</option>
            </select>
          </div>

          <div className="flex items-center text-[11px] text-white/70 bg-white/[0.04] p-2.5 rounded-xl border border-white/[0.07]">
            <Sparkles className="w-4 h-4 text-amber-400 mr-2 shrink-0" />
            <span>
              {language === "id"
                ? "Prioritas mengunci ketinggian pitch elevasi sepatu agar siluet tidak berubah saat digenerate."
                : "Priority locks heel pitch elevation so the shoe silhouette never morphs during generation."}
            </span>
          </div>
        </div>
      )}

      {/* Strict Mode & Reference Geometry Isolation Toggles */}
      <div className="space-y-2.5 pt-1">
        {/* Strict Product Mode */}
        <label className="flex items-start gap-3 p-3.5 rounded-2xl liquid-glass-subcard border border-white/[0.08] hover:border-[#3781fc]/60 cursor-pointer transition-all">
          <input
            type="checkbox"
            checked={strictProductMode}
            onChange={(e) => onToggleStrictMode(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-[#1951fc] focus:ring-[#3781fc] accent-[#1951fc]"
          />
          <div className="text-xs">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3781fc]" />
              <span>Strict Product Mode</span>
              <span className="text-[10px] uppercase font-bold text-[#3781fc] bg-[#1951fc]/20 px-2 py-0.5 rounded-full border border-white/[0.08]">
                Prioritaskan Blueprint &gt; Raw &gt; Ref
              </span>
            </div>
            <p className="text-white/70 text-[11px] mt-0.5 leading-relaxed font-medium">
              {language === "id"
                ? "Prioritaskan Blueprint > Raw > Ref. Jika aktif, AI sangat ketat mempertahankan desain asli (siluet, material, dan hardware)."
                : "Prioritize Blueprint > Raw > Ref. When active, AI strictly preserves original physical geometry and design."}
            </p>
          </div>
        </label>

        {/* Ignore Product Design from Reference */}
        <label className="flex items-start gap-3 p-3.5 rounded-2xl liquid-glass-subcard border border-white/[0.08] hover:border-[#3781fc]/60 cursor-pointer transition-all">
          <input
            type="checkbox"
            checked={ignoreProductDesignFromReference}
            onChange={(e) => onToggleIgnoreRefDesign(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-[#1951fc] focus:ring-[#3781fc] accent-[#1951fc]"
          />
          <div className="text-xs">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Layers className="w-3.5 h-3.5 text-[#3781fc]" />
              <span>Ignore Product Design from Reference</span>
              <span className="text-[10px] uppercase font-bold text-[#3781fc] bg-[#1951fc]/20 px-2 py-0.5 rounded-full border border-white/[0.08]">
                Active Guard
              </span>
            </div>
            <p className="text-white/70 text-[11px] mt-0.5 leading-relaxed font-medium">
              {language === "id"
                ? "Jika aktif, referensi HANYA digunakan untuk angle/lighting/background agar bentuk produk di referensi tidak ditiru."
                : "When active, reference is ONLY used for angle/lighting/background so product shapes in reference are never copied."}
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
