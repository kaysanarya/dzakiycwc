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
    <header className="h-14 w-full border-b border-studio-border bg-studio-bg/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Sisi Kiri (Branding) */}
      <div className="flex items-center gap-2 sm:gap-3 select-none shrink-0">
        <div className="flex items-center gap-2">
          <VellumLogoMark className="w-4 h-4 text-white fill-white shrink-0" color="#ffffff" />
          <span className="font-semibold tracking-wide text-white text-sm font-heading">
            VELLUM
          </span>
        </div>
        <div className="h-3.5 w-[1px] bg-studio-border hidden xs:block" />
        <span className="text-xs text-studio-muted font-medium hidden xs:block">
          Studio
        </span>
      </div>

      {/* Sisi Kanan (Actions & Indicators) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Indikator Status AI Engine */}
        <div
          id="header-api-key-badge"
          className="h-8 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 rounded-lg text-xs text-studio-text border border-studio-border bg-studio-card select-none"
          title={language === "id" ? "AI Studio Engine aktif dan terhubung" : "AI Studio Engine active and connected"}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
          <span className="text-xs text-studio-muted font-medium hidden sm:inline">
            Gemini Live
          </span>
        </div>

        {/* Tombol Demo Product */}
        <button
          onClick={onLoadDemoProduct}
          type="button"
          aria-label="Muat produk demo sepatu"
          className="h-8 px-2 sm:px-3 rounded-lg text-xs font-medium text-white border border-zinc-700 bg-studio-card hover:bg-studio-subcard transition-colors flex items-center gap-1.5 cursor-pointer"
          title={t.header.loadDemoProductTitle}
        >
          <Sparkles className="w-3.5 h-3.5 text-white shrink-0" />
          <span className="hidden sm:inline text-white">{t.header.loadDemoProduct}</span>
          <span className="sm:hidden text-xs text-white">Demo</span>
        </button>

        {/* Tombol History */}
        <button
          onClick={onOpenHistory}
          type="button"
          aria-label={`Buka/tutup riwayat foto, ${historyCount} tersimpan`}
          className={`h-8 px-2 sm:px-3 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
            isHistoryOpen
              ? "bg-studio-subcard border-zinc-500 text-studio-text shadow-xs"
              : "bg-studio-card border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-subcard"
          }`}
        >
          <History className="w-3.5 h-3.5 text-studio-muted shrink-0" />
          <span className="hidden sm:inline">{t.header.history}</span>
          {historyCount > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-studio-bg text-[10px] text-zinc-200 font-mono border border-studio-border">
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
          className="h-8 px-2 sm:px-2.5 rounded-lg text-xs text-studio-muted hover:text-studio-text border border-studio-border bg-studio-card hover:bg-studio-subcard transition-colors flex items-center gap-1 font-mono cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-studio-muted shrink-0" />
          <span className="uppercase text-[11px] font-semibold">{language === "en" ? "ID" : "EN"}</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
