"use client";

import React from "react";
import { Sparkles, History, Globe, KeyRound, CheckCircle2 } from "lucide-react";
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
}

export function Header({
  onLoadDemoProduct,
  onOpenHistory,
  onOpenApiSettings,
  hasApiKey,
  activeProviderName,
  historyCount,
  demoRemaining,
}: HeaderProps) {
  const { t, language, toggleLanguage } = useLanguage();

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-950 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <VellumLogo iconSize={24} showText={true} />
            <span className="hidden sm:inline-block text-[11px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
              Studio Foto AI
            </span>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-2">
          {/* AI Ready / Demo Mode indicator */}
          {hasApiKey ? (
            <button
              onClick={onOpenApiSettings}
              type="button"
              id="header-api-key-badge"
              aria-label="Pengaturan API Key aktif"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800 hover:bg-emerald-900/60 transition-colors cursor-pointer"
              title={language === "id" ? "API Key Anda Terhubung" : "Your API Key is Connected"}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                {t.header.ownKey}
                {activeProviderName ? ` (${activeProviderName.toUpperCase()})` : ""}
              </span>
            </button>
          ) : typeof demoRemaining === "number" ? (
            <button
              onClick={onOpenApiSettings}
              type="button"
              id="header-demo-quota-badge"
              aria-label="Status kuota demo"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                demoRemaining > 0
                  ? "bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800"
                  : "bg-rose-950/60 text-rose-300 border-rose-800 hover:bg-rose-900/60"
              }`}
              title={language === "id" ? "Klik untuk mengatur API Key" : "Click to set API Key"}
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span>
                {demoRemaining > 0
                  ? t.header.demoQuotaRemaining.replace("{count}", String(demoRemaining))
                  : t.header.demoQuotaExhausted}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenApiSettings}
              type="button"
              id="header-demo-mode-badge"
              aria-label="Mode demo aktif, klik untuk mengatur API key"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-900 text-amber-300 border border-amber-800/60 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{language === "id" ? "Demo (Atur Key)" : "Demo (Set Key)"}</span>
            </button>
          )}

          {/* Load Demo Product */}
          <button
            onClick={onLoadDemoProduct}
            type="button"
            aria-label="Muat produk demo sepatu"
            className="btn-secondary h-8 px-2.5 text-xs gap-1.5"
            title={t.header.loadDemoProductTitle}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">{t.header.loadDemoProduct}</span>
            <span className="sm:hidden">Demo</span>
          </button>

          {/* History */}
          <button
            onClick={onOpenHistory}
            type="button"
            aria-label={`Buka riwayat foto, ${historyCount} sesi tersimpan`}
            className="btn-secondary h-8 px-2.5 text-xs gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="hidden sm:inline">{t.header.history}</span>
            {historyCount > 0 && (
              <span className="w-4 h-4 text-[10px] flex items-center justify-center rounded-full bg-zinc-700 text-zinc-200 font-bold">
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
            className="btn-secondary h-8 px-2 text-xs font-bold"
          >
            <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="uppercase">{language === "en" ? "ID" : "EN"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
