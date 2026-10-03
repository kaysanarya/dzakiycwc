"use client";

import React, { useState } from "react";
import { CameraAngle, PhotographyDirection } from "@/types";
import { Camera, Check, X, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface CameraAngleOption {
  value: CameraAngle;
  labelId: string;
  labelEn: string;
  descId: string;
  descEn: string;
}

export const CAMERA_ANGLES: CameraAngleOption[] = [
  {
    value: "three_quarter",
    labelId: "3/4 Diagonal",
    labelEn: "3/4 Diagonal",
    descId: "Sudut komersial paling seimbang dan dinamis",
    descEn: "Standard balanced commercial e-commerce angle",
  },
  {
    value: "front",
    labelId: "Lurus Depan",
    labelEn: "Front Eye-Level",
    descId: "Simetris lurus sejajar mata lensa",
    descEn: "Clean symmetrical straight-on perspective",
  },
  {
    value: "side",
    labelId: "Profil Samping",
    labelEn: "Side Profile",
    descId: "Menampilkan siluet dan kontur samping produk",
    descEn: "Highlights product silhouette and side profile",
  },
  {
    value: "top",
    labelId: "Atas (Flatlay)",
    labelEn: "Top Flatlay",
    descId: "Tegak lurus 90° dari atas",
    descEn: "90° perpendicular top-down flatlay perspective",
  },
  {
    value: "low_angle",
    labelId: "Bawah (Megah)",
    labelEn: "Low Angle Hero",
    descId: "Perspektif rendah memberikan kesan megah dan premium",
    descEn: "Low perspective hero framing for premium look",
  },
  {
    value: "high_angle",
    labelId: "Atas 45°",
    labelEn: "High Angle 45°",
    descId: "Melihat permukaan atas dan samping secara proporsional",
    descEn: "Overhead 45° view showing top and side contours",
  },
  {
    value: "macro_detail",
    labelId: "Detail Makro",
    labelEn: "Macro Detail",
    descId: "Fokus dekat pada tekstur material dan jahitan asli",
    descEn: "Close zoom focusing on authentic material textures",
  },
];

interface AngleSelectorProps {
  direction: PhotographyDirection;
  onChangeDirection: (updated: PhotographyDirection) => void;
  variant?: "desktop" | "mobile";
  onCloseSheet?: () => void;
}

export function AngleSelector({
  direction,
  onChangeDirection,
  variant = "desktop",
  onCloseSheet,
}: AngleSelectorProps) {
  const { language } = useLanguage();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const selectedAngle =
    CAMERA_ANGLES.find((a) => a.value === direction.cameraAngle) ||
    CAMERA_ANGLES[0];

  // Mobile view with bottom sheet
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
            <div className="w-8 h-8 rounded-lg bg-studio-subcard border border-studio-border flex items-center justify-center text-studio-accent shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-studio-muted block font-mono">
                {language === "id" ? "Sudut Kamera" : "Camera Angle"}
              </span>
              <span className="text-sm font-semibold text-studio-text block font-heading">
                {language === "id" ? selectedAngle.labelId : selectedAngle.labelEn}
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
                      {language === "id" ? "Pilih Sudut Kamera" : "Select Camera Angle"}
                    </h3>
                    <p className="text-xs text-studio-muted mt-0.5">
                      {language === "id"
                        ? "Menentukan perspektif rotasi dan tata letak produk studio"
                        : "Defines product studio perspective and orientation"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSheetOpen(false)}
                    aria-label="Tutup pilihan sudut"
                    className="p-2 rounded-lg text-studio-muted hover:text-studio-text bg-studio-subcard border border-studio-border cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Angles List */}
              <div className="overflow-y-auto p-4 space-y-2.5 max-h-[60dvh]">
                {CAMERA_ANGLES.map((angle) => {
                  const isSelected = direction.cameraAngle === angle.value;
                  return (
                    <button
                      key={angle.value}
                      type="button"
                      onClick={() => {
                        onChangeDirection({
                          ...direction,
                          cameraAngle: angle.value,
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
                      <div>
                        <span
                          className={`text-sm font-semibold block font-heading ${
                            isSelected ? "text-studio-text" : "text-studio-text/90"
                          }`}
                        >
                          {language === "id" ? angle.labelId : angle.labelEn}
                        </span>
                        <span className="text-xs text-studio-muted block">
                          {language === "id" ? angle.descId : angle.descEn}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-studio-accent flex items-center justify-center text-studio-bg shrink-0 ml-2">
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

  // Desktop view: Compact grid in left sidebar
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-studio-text flex items-center gap-1.5 font-heading">
          <Camera className="w-3.5 h-3.5 text-studio-muted" />
          <span>{language === "id" ? "Sudut Kamera Studio" : "Camera Angle"}</span>
        </label>
        <span className="text-[10px] font-mono text-studio-dim uppercase">
          {selectedAngle.value}
        </span>
      </div>

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
                  ? "bg-studio-subcard text-studio-text border-studio-accent font-semibold ring-1 ring-studio-accent/70"
                  : "bg-studio-card/60 text-studio-muted hover:text-studio-text hover:bg-studio-subcard border-studio-border"
              }`}
            >
              {language === "id" ? angle.labelId : angle.labelEn}
            </button>
          );
        })}
      </div>
    </div>
  );
}
