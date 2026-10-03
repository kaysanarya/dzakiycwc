"use client";

import React from "react";
import { PreservationSettings } from "@/types";
import { Info, Camera, Box } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface PreservationControlsProps {
  settings: PreservationSettings;
  onChangeSettings: (settings: PreservationSettings) => void;
}

export function PreservationControls({
  settings,
  onChangeSettings,
}: PreservationControlsProps) {
  const { language } = useLanguage();

  return (
    <div className="space-y-4 pt-2">
      <div className="border-b border-white/[0.06] pb-2">
        <h3 className="text-sm font-bold text-white tracking-tight uppercase flex items-center gap-2">
          <span>{language === "id" ? "Detail Preservation & Reference Strength" : "Detail Preservation & Reference Strength"}</span>
        </h3>
        <p className="text-xs text-white/60 mt-0.5 font-medium">
          {language === "id"
            ? "Keseimbangan antara perlindungan identitas fisik produk dan kekuatan pengaruh referensi fotografi."
            : "Balance between physical product identity protection and photographic reference strength."}
        </p>
      </div>

      <div className="space-y-4 liquid-glass-subcard p-4 sm:p-5 rounded-2xl border border-white/[0.08] shadow-2xs">
        {/* Detail Preservation Slider (0 - 100, default 100, Requirement 6) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-[#1951fc]" />
              <span>Detail Preservation</span>
            </span>
            <span className="font-mono font-bold text-[#3781fc] bg-[#1951fc]/20 px-2.5 py-0.5 rounded-full border border-white/[0.08] shadow-2xs">
              {settings.detailPreservation}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.detailPreservation}
            onChange={(e) =>
              onChangeSettings({
                ...settings,
                detailPreservation: Number(e.target.value),
              })
            }
            className="w-full h-2 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-[#1951fc]"
          />
          <p className="text-[11px] text-white/80 mt-1 leading-normal font-medium">
            Menjaga detail produk agar identik dengan mentahan. (Rekomendasi: 100%)
          </p>
        </div>

        {/* Reference Strength Slider (0 - 100, default 100, Requirement 6) */}
        <div className="pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#1951fc]" />
              <span>Reference Strength</span>
            </span>
            <span className="font-mono font-bold text-white bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.08] shadow-2xs">
              {settings.referenceStrength}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.referenceStrength}
            onChange={(e) =>
              onChangeSettings({
                ...settings,
                referenceStrength: Number(e.target.value),
              })
            }
            className="w-full h-2 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-[#1951fc]"
          />
          <p className="text-[11px] text-white/80 mt-1 leading-normal font-medium">
            Tingkat kemiripan lighting, shadow, dan komposisi dengan referensi.
          </p>
        </div>

        {/* Visual Difference Diagram (Requirement 6: Jelaskan secara visual perbedaan kedua parameter ini) */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-[#3781fc] text-[11px] uppercase tracking-wide">
            <Info className="w-3.5 h-3.5 text-[#3781fc]" />
            <span>Perbandingan Visual: Detail Preservation vs Reference Strength</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-lg bg-[#1951fc]/08 border border-[#1951fc]/15 space-y-1">
              <span className="font-bold text-[#3781fc] flex items-center gap-1">
                📦 Detail Preservation (100%)
              </span>
              <p className="text-white/70 leading-relaxed font-medium">
                Mengunci <strong className="text-white/90">IDENTITAS FISIK</strong>: siluet produk, ketebalan sol/hak, jumlah tali, logo, jahitan, dan tekstur material asli tidak boleh bergeser.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/08 border border-amber-500/15 space-y-1">
              <span className="font-bold text-amber-400 flex items-center gap-1">
                💡 Reference Strength (100%)
              </span>
              <p className="text-white/70 leading-relaxed font-medium">
                Meniru <strong className="text-white/90">GAYA FOTOGRAFI</strong>: arah datangnya cahaya (key light), kelembutan bayangan, nuansa warna studio, dan sudut framing estetik.
              </p>
            </div>
          </div>
          <p className="text-[10px] text-white/40 italic pt-0.5">
            Prinsip VELLUM: Reference Strength TIDAK PERNAH mengubah bentuk produk. Geometri produk 100% mengikuti Detail Preservation dari foto mentahan.
          </p>
        </div>

        {/* Consistency Mode Toggle (Default ON, Requirement 9) */}
        <div className="pt-2 border-t border-white/[0.06]">
          <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
            <input
              type="checkbox"
              checked={settings.consistencyMode}
              onChange={(e) =>
                onChangeSettings({
                  ...settings,
                  consistencyMode: e.target.checked,
                })
              }
              className="mt-0.5 w-4 h-4 rounded text-[#1951fc] focus:ring-[#3781fc] accent-[#1951fc]"
            />
            <div className="text-xs">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <span>Consistency Mode</span>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {settings.consistencyMode ? "Default ON" : "Nonaktif"}
                </span>
              </div>
              <p className="text-white/80 text-[11px] mt-0.5 leading-relaxed font-medium">
                Memastikan output dalam satu batch memiliki konsistensi tone, lighting, crop, dan background, meski angle bervariasi.
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
