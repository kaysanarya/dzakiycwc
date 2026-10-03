"use client";

import React, { useState } from "react";
import { ValidationResult } from "@/types";
import { ShieldCheck, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ConsistencyBadgeProps {
  validation: ValidationResult;
  threshold?: number;
}

export function ConsistencyBadge({
  validation,
  threshold = 90,
}: ConsistencyBadgeProps) {
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const isUnverified = validation.score === null || validation.isFallback;
  const isPassing = !isUnverified && validation.score! >= threshold;

  return (
    <div className="card-flat-subtle p-3 w-full min-w-0 overflow-hidden">
      {/* Row 1: Header (Icon + Title on left, Score + Expand Toggle on right) */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {isUnverified ? (
            <div className="w-6 h-6 rounded bg-amber-950/80 border border-amber-800 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          ) : isPassing ? (
            <div className="w-6 h-6 rounded bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          )}
          <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider truncate">
            {language === "id" ? "Konsistensi Produk" : "Product Consistency"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-sm font-bold font-mono text-zinc-100">
            {validation.score !== null ? `${validation.score}%` : "N/A"}
          </span>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? "Tutup rincian konsistensi" : "Buka rincian konsistensi"}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Row 2: Status Badge (vertically organized below title) */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 min-w-0">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full max-w-full truncate ${
            isUnverified
              ? "bg-amber-500/15 text-amber-300 border border-amber-400/30"
              : isPassing
              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30"
              : "bg-rose-500/15 text-rose-300 border border-rose-400/30"
          }`}
        >
          {isUnverified
            ? language === "id"
              ? "BELUM TERVERIFIKASI"
              : "UNVERIFIED"
            : language === "id"
            ? isPassing
              ? "LOLOS AUDIT"
              : "PERLU GENERASI ULANG"
            : isPassing
            ? "PASSED"
            : "NEEDS REGENERATION"}
        </span>
      </div>

      {/* Row 3: Description text underneath */}
      <p className="mt-1 text-[11px] text-white/60 leading-relaxed break-words">
        {isUnverified
          ? language === "id"
            ? "Audit visual dilewati (mode demonstrasi atau provider tanpa vision)"
            : "Visual audit skipped (demo mode or generation-only provider)"
          : language === "id"
          ? "Estimasi Konsistensi AI (Skor Fidelitas Produk)"
          : "AI Consistency Estimate (Fidelity Score)"}
      </p>

      {/* Expanded Breakdown Checks */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2 text-xs">
          {Object.keys(validation.checks).length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(validation.checks).map(([key, val]) => {
                if (val === undefined) return null;
                return (
                  <div
                    key={key}
                    className="p-1.5 rounded-lg bg-white/[0.04] backdrop-blur-xs border border-white/[0.08] flex items-center justify-between shadow-2xs"
                  >
                    <span className="capitalize text-[10px] font-semibold text-white/80 truncate">
                      {key}:
                    </span>
                    <span className="font-mono font-bold text-white text-[11px]">
                      {val}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {validation.notes && validation.notes.length > 0 && (
            <div className="mt-2 text-[10px] text-white/60 space-y-1 break-words">
              {validation.notes.map((note: string, idx: number) => (
                <p key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold shrink-0">•</span>
                  <span className="break-words">{note}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
