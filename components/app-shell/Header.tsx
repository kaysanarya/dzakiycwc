"use client";

import React from "react";
import { Sparkles, History, Globe } from "lucide-react";
import { VellumLogoMark } from "./VellumLogo";
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
  onOpenApiSettings: _onOpenApiSettings,
  hasApiKey: _hasApiKey,
  activeProviderName: _activeProviderName,
  historyCount,
  demoRemaining: _demoRemaining,
  isHistoryOpen,
}: HeaderProps) {
  const { t, language, toggleLanguage } = useLanguage();

  return (
    <header className="h-14 w-full border-b border-zinc-800 bg-zinc-950/75 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Sisi Kiri (Branding) */}
      <div className="flex items-center gap-3 select-none">
        <div className="flex items-center gap-2.5">
          <VellumLogoMark className="w-4 h-4 text-zinc-100 shrink-0" />
          <span className="font-semibold tracking-wide text-zinc-100 text-sm">
            VELLUM
          </span>
        </div>
        <div className="h-4 w-[1px] bg-zinc-800" />
        <span className="text-xs text-zinc-400 font-medium">
          Studio
        </span>
      </div>

      {/* Sisi Kanan (Actions & Indicators) */}
      <div className="flex items-center gap-2">
        {/* Indikator Status AI Engine */}
        <div
          id="header-api-key-badge"
          className="h-8 flex items-center gap-2 px-2.5 py-1 rounded-md text-xs text-zinc-300 border border-zinc-800/80 bg-zinc-900/40 select-none"
          title={language === "id" ? "AI Studio Engine aktif dan terhubung" : "AI Studio Engine active and connected"}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          <span className="text-xs text-zinc-300 font-medium">
            Gemini Live
          </span>
        </div>

        {/* Tombol Demo Product */}
        <button
          onClick={onLoadDemoProduct}
          type="button"
          aria-label="Muat produk demo sepatu"
          className="h-8 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-300 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 transition-colors flex items-center gap-1.5 cursor-pointer"
          title={t.header.loadDemoProductTitle}
        >
          <Sparkles className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="hidden sm:inline">{t.header.loadDemoProduct}</span>
          <span className="sm:hidden">Demo</span>
        </button>

        {/* Tombol History */}
        <button
          onClick={onOpenHistory}
          type="button"
          aria-label={`Buka/tutup riwayat foto, ${historyCount} tersimpan`}
          className={`h-8 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-2 cursor-pointer ${
            isHistoryOpen
              ? "bg-zinc-800 border-zinc-700 text-zinc-100 shadow-xs"
              : "bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80 hover:border-zinc-700"
          }`}
        >
          <History className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="hidden sm:inline">{t.header.history}</span>
          {historyCount > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono border border-zinc-700/60">
              {historyCount}
            </span>
          )}
        </button>

        {/* Selector Bahasa / ID */}
        <button
          onClick={toggleLanguage}
          type="button"
          id="language-toggle-btn"
          aria-label="Ganti bahasa tampilan"
          title={language === "en" ? t.header.switchToId : t.header.switchToEn}
          className="h-8 px-2.5 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/80 transition-colors flex items-center gap-1.5 font-mono cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="uppercase text-[11px] font-semibold">{language === "en" ? "ID" : "EN"}</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
