"use client";

import React from "react";
import type { ProductLocks as ProductLocksType } from "@/types";
import { ShieldCheck } from "lucide-react";

interface ProductLocksProps {
  locks: ProductLocksType;
  onChangeLocks: (locks: ProductLocksType) => void;
}

export function ProductLocks({ locks, onChangeLocks }: ProductLocksProps) {
  const isPreserved = locks.preserveProductDetails ?? true;

  return (
    <div className="pt-2">
      <label className="flex items-start gap-3.5 p-4 rounded-2xl liquid-glass-subcard border border-white/[0.08] hover:border-[#3781fc]/50 cursor-pointer transition-all shadow-xs select-none">
        <input
          type="checkbox"
          checked={isPreserved}
          onChange={(e) =>
            onChangeLocks({
              preserveProductDetails: e.target.checked,
            })
          }
          className="mt-0.5 w-4 h-4 rounded text-[#1951fc] focus:ring-[#3781fc] accent-[#1951fc]"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#3781fc] shrink-0" />
            <span className="font-bold text-white text-xs sm:text-sm">
              Pertahankan detail produk
            </span>
            <span className="text-[10px] font-extrabold tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/40">
              AKTIF
            </span>
          </div>
          <p className="text-white/70 text-xs mt-1 leading-relaxed font-medium">
            Produk ditempel dari foto aslinya, bentuk dan warna tidak diubah AI.
          </p>
        </div>
      </label>
    </div>
  );
}
