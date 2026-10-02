"use client";

import React from "react";
import type { ProductLocks as ProductLocksType } from "@/types";
import { Lock, Unlock, AlertTriangle, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ProductLocksProps {
  locks: ProductLocksType;
  onChangeLocks: (locks: ProductLocksType) => void;
}

interface LockItemConfig {
  key: keyof ProductLocksType;
  label: string;
  isCritical?: boolean;
  desc: string;
}

const PRIMARY_LOCKS: LockItemConfig[] = [
  { key: "lockShape", label: "Lock Shape", isCritical: true, desc: "Rigid silhouette geometry" },
  { key: "lockProportion", label: "Lock Proportion", isCritical: true, desc: "Scale and aspect ratios" },
  { key: "lockColor", label: "Lock Color", isCritical: true, desc: "Exact hex & undertone matching" },
  { key: "lockMaterial", label: "Lock Material", isCritical: true, desc: "Leather, suede, metal, mesh" },
  { key: "lockTexture", label: "Lock Texture", desc: "Micro-grain and tactile finish" },
  { key: "lockConstruction", label: "Lock Construction", desc: "Seams, welts & assembly structure" },
  { key: "lockLogo", label: "Lock Logo", isCritical: true, desc: "Brand debossing & placement" },
  { key: "lockStrap", label: "Lock Strap", desc: "Strap curvature & alignment" },
  { key: "lockBuckle", label: "Lock Buckle", desc: "Hardware finish & cast contours" },
  { key: "lockOrnament", label: "Lock Ornament", desc: "Decorative accents & studs" },
  { key: "lockStitching", label: "Lock Stitching", desc: "Gauge, thread color & pitch" },
  { key: "lockOutsole", label: "Lock Outsole", desc: "Sole profile & bottom pattern" },
];

export function ProductLocks({ locks, onChangeLocks }: ProductLocksProps) {
  const { t } = useLanguage();
  const toggleLock = (key: keyof ProductLocksType) => {
    onChangeLocks({
      ...locks,
      [key]: !locks[key],
    });
  };

  const hasCriticalUnlocked =
    !locks.lockShape || !locks.lockColor || !locks.lockProportion || !locks.lockMaterial || !locks.lockLogo;

  return (
    <div className="space-y-3.5 pt-2">
      <div className="border-b border-white/[0.06] pb-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight uppercase flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#1951fc]" />
            <span>Product Lock (Kunci Desain)</span>
            <span className="text-[10px] font-extrabold tracking-wider text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-400/50 shadow-2xs">
              STRICT
            </span>
          </h3>
          <p className="text-xs text-white/60 mt-0.5 font-medium">
            Immobilisasi atribut fisik terhadap generative drift (semua aktif secara default).
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const allOn = Object.keys(locks).reduce((acc, k) => {
              acc[k as keyof ProductLocksType] = true;
              return acc;
            }, {} as ProductLocksType);
            onChangeLocks(allOn);
          }}
          className="liquid-glass-btn px-3 py-1 rounded-full text-[11px] font-bold text-white bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 hover:border-white/20 cursor-pointer shadow-2xs transition-all"
        >
          {t.productLocks.lockAll}
        </button>
      </div>

      {/* Critical Unlock Warning Banner (Requirement 7) */}
      {hasCriticalUnlocked && (
        <div className="p-3.5 rounded-2xl liquid-glass-subcard bg-rose-500/15 border border-rose-400/30 flex items-start gap-2.5 text-xs shadow-2xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <p className="font-bold text-rose-200">
              Peringatan: Atribut Kunci Desain Dimatikan!
            </p>
            <p className="text-[11px] mt-0.5 text-rose-300/90 font-medium">
              {!locks.lockShape && "Warning: Unlocking Shape may cause AI to alter original geometry. "}
              {!locks.lockColor && "Warning: Unlocking Color allows generative color drift. "}
              {!locks.lockProportion && "Warning: Unlocking Proportion may distort the product silhouette. "}
              {!locks.lockMaterial && "Warning: Unlocking Material may replace fabric/leather finish. "}
              {!locks.lockLogo && "Warning: Unlocking Logo may erase or misplace brand marks. "}
            </p>
          </div>
        </div>
      )}

      {/* Checkboxes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {PRIMARY_LOCKS.map(({ key, label, isCritical, desc }) => {
          const isLocked = locks[key];
          return (
            <label
              key={key}
              className={`flex items-start gap-2.5 p-3 rounded-2xl border transition-all cursor-pointer select-none shadow-2xs ${isLocked
                  ? "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15]"
                  : "bg-rose-500/10 border-rose-400/40 text-rose-300"
                }`}
            >
              <input
                type="checkbox"
                checked={isLocked}
                onChange={() => toggleLock(key)}
                className="mt-0.5 w-4 h-4 rounded text-[#1951fc] focus:ring-[#3781fc] accent-[#1951fc]"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs font-semibold truncate ${isLocked ? "text-white" : "text-rose-300"
                      }`}
                  >
                    {label}
                  </span>
                  {isCritical && isLocked && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" title="Critical preservation attribute" />
                  )}
                </div>
                <p className="text-[10px] text-white/60 truncate mt-0.5 font-medium">{desc}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
