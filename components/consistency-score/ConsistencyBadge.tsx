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
    <div className="liquid-glass-subcard border border-white/[0.08] rounded-2xl p-3.5 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {isUnverified ? (
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-2xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
          ) : isPassing ? (
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-400/40 flex items-center justify-center text-rose-400 shadow-2xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wide">
                {language === "id" ? "Konsistensi Produk" : "Product Consistency"}
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  isUnverified
                    ? "bg-amber-500/15 text-amber-300 border border-amber-400/30"
                    : isPassing
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30"
                    : "bg-rose-500/15 text-rose-300 border border-rose-400/30"
                }`}
              >
                {isUnverified
                  ? language === "id" ? "BELUM TERVERIFIKASI" : "UNVERIFIED"
                  : language === "id"
                  ? isPassing
                    ? "LOLOS"
                    : "PERLU GENERASI ULANG"
                  : isPassing
                  ? "PASSED"
                  : "NEEDS REGENERATION"}
              </span>
            </div>
            <p className="text-[10px] text-white/60 font-medium">
              {isUnverified
                ? language === "id"
                  ? "Audit visual dilewati (provider tidak mendukung vision)"
                  : "Visual audit skipped (provider does not support vision)"
                : language === "id"
                ? "Estimasi Konsistensi AI (Skor Fidelitas)"
                : "AI Consistency Estimate (Fidelity Score)"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg font-black font-mono tracking-tight text-white">
            {validation.score !== null ? `${validation.score}%` : "N/A"}
          </span>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="liquid-glass-btn p-1 rounded-full text-white/60 hover:text-white transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Breakdown Checks (Section 24) */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(validation.checks).map(([key, val]) => {
              if (val === undefined) return null;
              return (
                <div
                  key={key}
                  className="p-2 rounded-xl bg-white/[0.04] backdrop-blur-xs border border-white/[0.08] flex items-center justify-between shadow-2xs"
                >
                  <span className="capitalize text-[11px] font-semibold text-white/80">
                    {key}:
                  </span>
                  <span className="font-mono font-bold text-white">
                    {val}%
                  </span>
                </div>
              );
            })}
          </div>

          {validation.notes && validation.notes.length > 0 && (
            <div className="mt-2 text-[10px] text-white/60 space-y-1">
              {validation.notes.map((note: string, idx: number) => (
                <p key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{note}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
