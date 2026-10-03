"use client";

import React, { useState } from "react";
import { ProductCategory } from "@/types";
import { CheckCircle2, ChevronDown, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ProductSpecProps {
  category: ProductCategory;
  onChangeCategory: (category: ProductCategory) => void;
  detectedLabel?: string;
}

const CATEGORY_OPTIONS: { value: ProductCategory; labelId: string; labelEn: string }[] = [
  { value: "footwear", labelId: "Sepatu hak (Footwear)", labelEn: "Heels & Footwear" },
  { value: "handbags", labelId: "Tas tangan", labelEn: "Handbags & Bags" },
  { value: "apparel", labelId: "Pakaian", labelEn: "Apparel & Fashion" },
  { value: "jewelry", labelId: "Perhiasan & Jam", labelEn: "Jewelry & Watches" },
  { value: "cosmetics", labelId: "Kosmetik & Skincare", labelEn: "Cosmetics & Skincare" },
  { value: "electronics", labelId: "Elektronik", labelEn: "Consumer Electronics" },
  { value: "accessories", labelId: "Aksesoris", labelEn: "Accessories" },
  { value: "furniture", labelId: "Furnitur", labelEn: "Furniture & Decor" },
  { value: "custom", labelId: "Produk kustom", labelEn: "Custom Product" },
];

export function ProductSpec({
  category,
  onChangeCategory,
  detectedLabel,
}: ProductSpecProps) {
  const { language } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);

  const getAutoDetectedName = () => {
    if (detectedLabel) return detectedLabel;
    if (category === "footwear") return language === "id" ? "sepatu hak" : "heels / footwear";
    if (category === "handbags") return language === "id" ? "tas tangan" : "handbag";
    if (category === "apparel") return language === "id" ? "pakaian" : "apparel";
    if (category === "jewelry") return language === "id" ? "perhiasan" : "jewelry";
    if (category === "cosmetics") return language === "id" ? "botol kosmetik" : "cosmetics";
    if (category === "electronics") return language === "id" ? "elektronik" : "electronics";
    if (category === "accessories") return language === "id" ? "aksesoris" : "accessories";
    if (category === "furniture") return language === "id" ? "furnitur" : "furniture";
    return language === "id" ? "produk komersial" : "commercial product";
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="border-b border-white/[0.06] pb-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>{language === "id" ? "Kategori Produk" : "Product Category"}</span>
          </h3>
          <p className="text-xs text-white/60 mt-0.5 font-medium">
            {language === "id"
              ? "Kategori produk dan tipe bentuk terdeteksi secara otomatis dari foto."
              : "Product category and silhouette type are detected automatically from photos."}
          </p>
        </div>
      </div>

      <div className="p-4 rounded-2xl liquid-glass-subcard border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        {/* Read-Only Detection Chip */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === "id" ? `Terdeteksi: ${getAutoDetectedName()}` : `Detected: ${getAutoDetectedName()}`}</span>
            </div>
            <p className="text-[11px] text-white/60 mt-1 font-medium">
              {language === "id" ? "Bentuk fisik dan dimensi asli langsung dikunci." : "Physical shape and contours are locked from photo."}
            </p>
          </div>
        </div>

        {/* Correction Button */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="liquid-glass-btn px-3 py-1.5 rounded-xl text-xs font-bold text-white/90 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>{language === "id" ? "Koreksi" : "Correct"}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isEditing ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Simple Category Dropdown when Correct is clicked */}
      {isEditing && (
        <div className="p-3.5 rounded-2xl bg-[#0a0d18] border border-[#3781fc]/40 shadow-xl space-y-2">
          <label className="block text-xs font-bold text-white/90">
            {language === "id" ? "Pilih Kategori Sebenarnya:" : "Select Actual Category:"}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {CATEGORY_OPTIONS.map((opt) => {
              const isSelected = category === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChangeCategory(opt.value);
                    setIsEditing(false);
                  }}
                  className={`p-2.5 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-[#1951fc] text-white border-[#3781fc] shadow-sm"
                      : "bg-white/[0.03] text-white/80 hover:text-white border-white/[0.08] hover:bg-white/[0.06]"
                  }`}
                >
                  <span>{language === "id" ? opt.labelId : opt.labelEn}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
