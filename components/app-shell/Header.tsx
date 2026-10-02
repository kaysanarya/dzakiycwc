"use client";

import React from "react";
import { Sparkles, History, Globe, Settings2 } from "lucide-react";
import { VellumLogo } from "./VellumLogo";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface HeaderProps {
  isDemo: boolean;
  activeProviderName?: string;
  onLoadDemoProduct: () => void;
  onOpenHistory: () => void;
  onOpenApiSettings: () => void;
  historyCount: number;
}

export function Header({
  isDemo,
  activeProviderName,
  onLoadDemoProduct,
  onOpenHistory,
  onOpenApiSettings,
  historyCount,
}: HeaderProps) {
  const { t, language, toggleLanguage } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full liquid-glass-header">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-3">

        {/* Brand identity */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-1.5 rounded-xl bg-white/[0.05] border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
              <VellumLogo iconSize={28} showText={true} />
            </div>
            <div className="hidden sm:block h-5 w-px bg-white/10 mx-0.5" />
            <span className="hidden sm:inline-flex text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full bg-[#1951fc]/90 text-white shadow-[0_2px_12px_rgba(25,81,252,0.45)] border border-white/[0.08]">
              {t.header.productPhotographyDirector}
            </span>
          </div>

          {/* Mobile: Language toggle */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={toggleLanguage}
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-[#1951fc] text-white shadow-[0_2px_8px_rgba(25,81,252,0.4)] cursor-pointer active:scale-95"
            >
              <Globe className="w-3 h-3 opacity-80" />
              <span>{language === "en" ? "ID" : "EN"}</span>
            </button>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-1.5 w-full md:w-auto justify-start md:justify-end overflow-x-auto no-scrollbar py-0.5">

          {/* Mode Pill */}
          {isDemo ? (
            <button
              type="button"
              onClick={onOpenApiSettings}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/15 text-amber-400 border border-amber-500/20 transition-all cursor-pointer active:scale-95"
              title="Klik untuk menghubungkan API Key"
            >
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
              </span>
              <span className="tracking-wide whitespace-nowrap">{language === "id" ? "MODE DEMO · ATUR API" : "DEMO MODE · SETUP API"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenApiSettings}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer active:scale-95"
              title="API Terhubung"
            >
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
              </span>
              <span className="tracking-wide whitespace-nowrap">{activeProviderName ? `API AKTIF (${activeProviderName})` : "REAL AI MODE"}</span>
            </button>
          )}

          {/* API Settings */}
          <button
            onClick={onOpenApiSettings}
            type="button"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full text-white/70 hover:text-white border border-white/08 bg-white/[0.05] hover:bg-white/[0.09] transition-all cursor-pointer active:scale-95"
            title="Pengaturan API Key"
          >
            <Settings2 className="w-3.5 h-3.5 text-white/50 shrink-0" />
            <span className="whitespace-nowrap">{language === "id" ? "API" : "API"}</span>
          </button>

          {/* Load Demo */}
          <button
            onClick={onLoadDemoProduct}
            type="button"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full text-white/70 hover:text-white border border-white/08 bg-white/[0.05] hover:bg-white/[0.09] transition-all cursor-pointer active:scale-95"
            title={t.header.loadDemoProductTitle}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
            <span className="whitespace-nowrap">{t.header.loadDemoProduct}</span>
          </button>

          {/* History */}
          <button
            onClick={onOpenHistory}
            type="button"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full text-white/70 hover:text-white border border-white/08 bg-white/[0.05] hover:bg-white/[0.09] transition-all cursor-pointer active:scale-95"
          >
            <History className="w-3.5 h-3.5 text-white/40 shrink-0" />
            <span className="whitespace-nowrap">{t.header.history}</span>
            {historyCount > 0 && (
              <span className="w-4 h-4 text-[10px] flex items-center justify-center rounded-full bg-[#1951fc] text-white font-black shadow-[0_2px_6px_rgba(25,81,252,0.5)]">
                {historyCount}
              </span>
            )}
          </button>

          {/* Desktop Language Toggle */}
          <button
            onClick={toggleLanguage}
            type="button"
            id="language-toggle-btn"
            title={language === "en" ? t.header.switchToId : t.header.switchToEn}
            className="hidden md:inline-flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold rounded-full bg-[#1951fc] hover:bg-[#3781fc] text-white shadow-[0_2px_12px_rgba(25,81,252,0.40)] border border-white/[0.06] cursor-pointer active:scale-95 transition-all"
          >
            <Globe className="w-3.5 h-3.5 opacity-80" />
            <span className="tracking-wider uppercase">{language === "en" ? "ID" : "EN"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
