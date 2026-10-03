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

      <div className="p-3 rounded-lg card-flat-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Read-Only Detection Chip */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-medium text-xs">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>{language === "id" ? `Terdeteksi: ${getAutoDetectedName()}` : `Detected: ${getAutoDetectedName()}`}</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-normal">
              {language === "id" ? "Bentuk fisik dan dimensi dikunci dari foto." : "Physical shape and contours locked from photo."}
            </p>
          </div>
        </div>

        {/* Correction Button */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            aria-label={language === "id" ? "Koreksi kategori produk" : "Correct product category"}
            onClick={() => setIsEditing(!isEditing)}
            className="btn-secondary h-7 px-2.5 text-xs gap-1.5"
          >
            <span>{language === "id" ? "Koreksi" : "Correct"}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isEditing ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Simple Category Dropdown when Correct is clicked */}
      {isEditing && (
        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-700 space-y-2">
          <label className="block text-xs font-semibold text-zinc-200">
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
                  className={`p-2 rounded-md text-left text-xs font-medium border transition-colors cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-zinc-800/80 text-zinc-300 hover:text-white border-zinc-700 hover:bg-zinc-800"
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
