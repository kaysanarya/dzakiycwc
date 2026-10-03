"use client";

import React, { useState } from "react";
import { ProductBlueprint } from "@/types";
import { X, Copy, Check, FileCode } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface BlueprintSheetProps {
  blueprint: ProductBlueprint | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BlueprintSheet({
  blueprint,
  isOpen,
  onClose,
}: BlueprintSheetProps) {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !blueprint) return null;

  const jsonString = JSON.stringify(blueprint, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex flex-col justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[88dvh] bg-studio-bg border-t border-studio-border rounded-t-2xl flex flex-col overflow-hidden pb-safe animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pt-3 pb-2.5 px-4 flex flex-col items-center border-b border-studio-border bg-studio-card">
          <div className="w-10 h-1 rounded-full bg-studio-border mb-3" />
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-zinc-200" />
              <div>
                <h3 className="text-sm font-semibold text-studio-text font-heading">
                  {language === "id" ? "Product Blueprint" : "Product Blueprint"}
                </h3>
                <span className="text-[11px] font-mono text-studio-muted">
                  {blueprint.category} • {blueprint.subcategory || "commercial"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="min-h-[36px] px-2.5 rounded-lg border border-studio-border bg-studio-subcard text-xs text-studio-text flex items-center gap-1.5 cursor-pointer hover:bg-studio-elevated"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === "id" ? "Tersalin" : "Copied"}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-studio-muted" />
                    <span>{language === "id" ? "Salin JSON" : "Copy JSON"}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup blueprint sheet"
                className="min-h-[36px] min-w-[36px] rounded-lg border border-studio-border bg-studio-subcard text-studio-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable JSON content without breaking page width */}
        <div className="p-4 overflow-y-auto max-h-[65dvh]">
          <pre className="p-3 rounded-xl bg-studio-card border border-studio-border text-studio-text font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed select-text">
            {jsonString}
          </pre>
        </div>
      </div>
    </div>
  );
}
