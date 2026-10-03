"use client";

import React, { useState } from "react";
import { ProductBlueprint } from "@/types";
import { X, Copy, Check, Layers } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface BlueprintModalProps {
  blueprint: ProductBlueprint | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BlueprintModal({ blueprint, isOpen, onClose }: BlueprintModalProps) {
  const [activeTab, setActiveTab] = useState<"structured" | "json">("structured");
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  if (!isOpen || !blueprint) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(blueprint, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card-flat w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-100">
                  {t.blueprintModal.title}
                </h3>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  {t.blueprintModal.confidence} {Math.round(blueprint.confidence * 100)}%
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {t.blueprintModal.internalDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("structured")}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  activeTab === "structured"
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {t.blueprintModal.facts}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("json")}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  activeTab === "json"
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {t.blueprintModal.rawJson}
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup modal blueprint"
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === "structured" ? (
            <div className="space-y-4">
              {/* Primary Facts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] transition-all shadow-2xs">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">
                    {t.blueprintModal.categorySubcategory}
                  </span>
                  <span className="text-xs font-semibold text-white mt-0.5 block capitalize">
                    {blueprint.category} • {blueprint.subcategory || "Standard"}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] transition-all shadow-2xs">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">
                    {t.blueprintModal.colorSpec}
                  </span>
                  <span className="text-xs font-semibold text-white mt-0.5 block">
                    {blueprint.color}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] transition-all shadow-2xs">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">
                    {t.blueprintModal.materialsFinish}
                  </span>
                  <span className="text-xs font-semibold text-white mt-0.5 block">
                    {blueprint.material} ({blueprint.texture})
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] transition-all shadow-2xs">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">
                    {t.blueprintModal.constructionAssembly}
                  </span>
                  <span className="text-xs font-semibold text-white mt-0.5 block">
                    {blueprint.construction}
                  </span>
                </div>
              </div>

              {/* Shape & Proportions */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2 shadow-2xs">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">
                  {t.blueprintModal.geometricSilhouette}
                </span>
                <p className="text-xs text-white/90 leading-relaxed font-medium">
                  {blueprint.shape}
                </p>
                {blueprint.proportions && (
                  <p className="text-xs text-white/60 pt-2 border-t border-white/[0.08]">
                    <span className="font-semibold text-white">{t.blueprintModal.proportions} </span>
                    {blueprint.proportions}
                  </p>
                )}
              </div>

              {/* Footwear Specific Specs (If applicable) */}
              {blueprint.heel && (
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.1] space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wide">
                      {t.blueprintModal.footwearHeelArchitecture}
                    </span>
                    <span className="text-[10px] font-semibold text-zinc-400">
                      {t.blueprintModal.lockedConstraints}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-white/60 block">{t.blueprintModal.height}</span>
                      <span className="font-bold text-white">{blueprint.heel.heelHeight}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/60 block">{t.blueprintModal.profileShape}</span>
                      <span className="font-bold text-white">{blueprint.heel.heelShape}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/60 block">{t.blueprintModal.anglePitch}</span>
                      <span className="font-bold text-white">{blueprint.heel.heelAngle}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/60 block">{t.blueprintModal.frontSole}</span>
                      <span className="font-bold text-white">{blueprint.heel.frontSoleThickness}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Hardware & Components */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2 shadow-2xs">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">
                  {t.blueprintModal.identifiedComponents}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {blueprint.components.map((comp: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-white font-medium shadow-2xs"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
                {blueprint.hardware && (
                  <p className="text-xs text-white/60 pt-2 border-t border-white/[0.06]">
                    <span className="font-semibold text-white">{t.blueprintModal.hardware} </span>
                    {blueprint.hardware.type} in {blueprint.hardware.finish} ({blueprint.hardware.color})
                  </p>
                )}
              </div>

              {/* Visual notes */}
              {blueprint.visualNotes && (
                <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-400/25 text-xs text-slate-300 shadow-2xs">
                  <span className="font-semibold text-sky-300">{t.blueprintModal.directorNotes} </span>
                  {blueprint.visualNotes}
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={handleCopyJson}
                className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-xs text-white cursor-pointer transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.blueprintModal.copied : t.blueprintModal.copyJson}</span>
              </button>
              <pre className="p-4.5 bg-[#080b14] border border-white/[0.08] text-slate-200 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed shadow-inner">
                {JSON.stringify(blueprint, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
