"use client";

import React from "react";
import { Sparkles, History, Globe } from "lucide-react";
import { VellumLogo } from "./VellumLogo";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface HeaderProps {
  onLoadDemoProduct: () => void;
  onOpenHistory: () => void;
  onOpenApiSettings?: () => void;
  hasApiKey?: boolean;
  activeProviderName?: string;
  historyCount: number;
  demoRemaining?: number | null;
  isHistoryOpen?: boolean;
}

export function Header({
  onLoadDemoProduct,
  onOpenHistory,
  onOpenApiSettings,
  hasApiKey,
  activeProviderName,
  historyCount,
  demoRemaining,
  isHistoryOpen,
}: HeaderProps) {
  const { t, language, toggleLanguage } = useLanguage();

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-[1600px] mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <VellumLogo iconSize={22} showText={true} />
            <span className="hidden sm:inline-block text-[10px] font-mono tracking-wider uppercase text-zinc-400 bg-zinc-900 border border-zinc-800/80 px-2 py-0.5 rounded">
              PRO STUDIO
            </span>
          </div>
        </div>

        {/* Status & Actions - Monochromatic Utilitarian Pro Style */}
        <div className="flex items-center gap-2">
          {/* API Status Dot */}
          <button
            onClick={onOpenApiSettings}
            type="button"
            id="header-api-key-badge"
            aria-label="Status API Key"
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 transition-colors cursor-pointer"
            title={hasApiKey ? (language === "id" ? "API Key Aktif" : "API Key Connected") : "Demo Mode"}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                hasApiKey
                  ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
                  : typeof demoRemaining === "number" && demoRemaining === 0
                  ? "bg-rose-500"
                  : "bg-zinc-500"
              }`}
            />
            <span className="text-[11px] font-medium text-zinc-300">
              {hasApiKey
                ? `API Ready${activeProviderName ? ` (${activeProviderName.toUpperCase()})` : ""}`
                : typeof demoRemaining === "number"
                ? demoRemaining > 0
                  ? `Demo (${demoRemaining})`
                  : "Demo Quota"
                : "Demo"}
            </span>
          </button>

          {/* Load Demo Product */}
          <button
            onClick={onLoadDemoProduct}
            type="button"
            aria-label="Muat produk demo sepatu"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-700 transition-colors cursor-pointer"
            title={t.header.loadDemoProductTitle}
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="hidden sm:inline">{t.header.loadDemoProduct}</span>
            <span className="sm:hidden">Demo</span>
          </button>

          {/* History Toggle (Opens/Closes right sidebar) */}
          <button
            onClick={onOpenHistory}
            type="button"
            aria-label={`Buka/tutup riwayat foto, ${historyCount} tersimpan`}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
              isHistoryOpen
                ? "bg-zinc-800 border-zinc-700 text-zinc-100 shadow-xs"
                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-700"
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{t.header.history}</span>
            {historyCount > 0 && (
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                {historyCount}
              </span>
            )}
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            type="button"
            id="language-toggle-btn"
            aria-label="Ganti bahasa tampilan"
            title={language === "en" ? t.header.switchToId : t.header.switchToEn}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono font-semibold bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 hover:border-zinc-700 transition-colors"
          >
            <Globe className="w-3 h-3 text-zinc-400 shrink-0" />
            <span className="uppercase text-[11px]">{language === "en" ? "ID" : "EN"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
