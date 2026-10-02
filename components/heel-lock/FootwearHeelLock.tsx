"use client";

import React from "react";
import { ProductLocks } from "@/types";
import { Footprints } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface FootwearHeelLockProps {
  locks: ProductLocks;
  onChangeLocks: (locks: ProductLocks) => void;
  category: string;
}

export function FootwearHeelLock({
  locks,
  onChangeLocks,
  category,
}: FootwearHeelLockProps) {
  const { t, language } = useLanguage();

  const HEEL_LOCKS: Array<{ key: keyof ProductLocks; label: string; desc: string }> = [
    {
      key: "lockHeelHeight",
      label: t.heelLock.lockHeelHeight,
      desc: language === "id" ? "Elevasi pitch tepat mm" : "Elevation pitch exact mm",
    },
    {
      key: "lockHeelWidth",
      label: t.heelLock.lockHeelWidth,
      desc: language === "id" ? "Dimensi pinggang & mahkota" : "Waist & crown dimensions",
    },
    {
      key: "lockHeelAngle",
      label: t.heelLock.lockHeelAngle,
      desc: language === "id" ? "Sudut tanah struktural 88°" : "88° structural ground angle",
    },
    {
      key: "lockHeelPosition",
      label: t.heelLock.lockHeelPosition,
      desc: language === "id" ? "Penyelarasan vertikal kalkaneus" : "Calcaneus vertical alignment",
    },
    {
      key: "lockHeelShape",
      label: t.heelLock.lockHeelShape,
      desc: language === "id" ? "Profil melebar jam pasir" : "Hourglass flared profile",
    },
    {
      key: "lockHeelThickness",
      label: t.heelLock.lockHeelThickness,
      desc: language === "id" ? "Ketebalan blok arsitektural" : "Architectural block gauge",
    },
    {
      key: "lockFrontSoleThickness",
      label: t.heelLock.lockFrontSole,
      desc: language === "id" ? "Kedalaman platform / welt" : "Platform / welt depth",
    },
    {
      key: "lockHeelProportion",
      label: t.heelLock.lockHeelProportion,
      desc: language === "id" ? "Kurva elevasi jari ke tumit" : "Toe-to-heel elevation curve",
    },
  ];

  // Hide completely for non-footwear
  if (category !== "footwear") {
    return null;
  }

  const toggleLock = (key: keyof ProductLocks) => {
    onChangeLocks({
      ...locks,
      [key]: !locks[key],
    });
  };

  return (
    <div className="space-y-3.5 pt-3 p-4.5 rounded-2xl liquid-glass-subcard bg-sky-500/10 border border-sky-400/40 shadow-2xs">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 backdrop-blur-md flex items-center justify-center text-sky-400 border border-sky-400/30 shadow-2xs">
            <Footprints className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wide">
              {t.heelLock.title}
            </h4>
            <p className="text-[11px] text-white/60 font-medium">
              {t.heelLock.desc}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-sky-300 bg-sky-500/15 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-sky-400/30 shadow-2xs">
          {language === "id" ? "Hanya Alas Kaki" : "Footwear Only"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {HEEL_LOCKS.map(({ key, label, desc }) => {
          const isLocked = locks[key];
          return (
            <label
              key={key}
              className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all shadow-2xs ${
                isLocked
                  ? "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] text-white"
                  : "bg-rose-500/10 border-rose-400/40 text-rose-300"
              }`}
            >
              <input
                type="checkbox"
                checked={isLocked}
                onChange={() => toggleLock(key)}
                className="mt-0.5 w-3.5 h-3.5 rounded text-[#1951fc] focus:ring-[#3781fc] accent-[#1951fc]"
              />
              <div className="min-w-0">
                <span className="font-bold block truncate text-[11px] text-white">
                  {label}
                </span>
                <span className="text-[10px] text-white/60 block truncate font-medium">
                  {desc}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
