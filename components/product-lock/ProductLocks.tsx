"use client";

import React from "react";
import type { ProductLocks as ProductLocksType } from "@/types";
import { ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ProductLocksProps {
  locks: ProductLocksType;
  onChangeLocks: (locks: ProductLocksType) => void;
}

export function ProductLocks({ locks, onChangeLocks }: ProductLocksProps) {
  const { t, language } = useLanguage();
  const isPreserved = locks.preserveProductDetails ?? true;

  return (
    <div className="pt-1">
      <label className="flex items-start gap-3 p-3 rounded-lg card-flat-subtle hover:border-zinc-700 cursor-pointer transition-colors select-none">
        <input
          type="checkbox"
          checked={isPreserved}
          onChange={(e) =>
            onChangeLocks({
              preserveProductDetails: e.target.checked,
            })
          }
          className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-zinc-500 accent-zinc-200"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-zinc-300 shrink-0" />
            <span className="font-semibold text-zinc-100 text-xs">
              {t.productLocks.preserveDetails}
            </span>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
              {language === "id" ? "Aktif" : "Active"}
            </span>
          </div>
          <p className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed font-normal">
            {t.productLocks.desc}
          </p>
        </div>
      </label>
    </div>
  );
}
