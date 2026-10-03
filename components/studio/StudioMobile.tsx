"use client";

import React, { useState } from "react";
import { StudioSession } from "@/lib/hooks/useStudioSession";
import { ProductSourceUpload } from "@/components/upload/ProductSourceUpload";
import { PresetPicker } from "@/components/studio/PresetPicker";
import { AngleSelector } from "@/components/studio/AngleSelector";
import { ResultViewer } from "@/components/studio/ResultViewer";
import { BlueprintSheet } from "@/components/studio/BlueprintSheet";
import { HistoryDrawer } from "@/components/history/HistoryDrawer";
import { AgentMonitor } from "@/components/agent-monitor/AgentMonitor";
import {
  Play,
  Sparkles,
  AlertTriangle,
  Sliders,
  ChevronDown,
  Layers,
} from "lucide-react";

interface StudioMobileProps {
  session: StudioSession;
}

export function StudioMobile({ session }: StudioMobileProps) {
  const {
    sourceImages,
    setSourceImages,
    referenceImages: _referenceImages,
    setReferenceImages: _setReferenceImages,
    category: _category,
    direction,
    setDirection,
    generationCount,
    setGenerationCount,
    isGenerating,
    hasStarted,
    pipelineSteps,
    currentLogMessage,
    blueprint,
    generatedOutputs,
    selectedOutputIndex,
    setSelectedOutputIndex,
    isHistoryDrawerOpen,
    setIsHistoryDrawerOpen,
    demoRemaining: _demoRemaining,
    quotaExceededNotice,
    setQuotaExceededNotice,
    errorMessage,
    setErrorMessage,
    historyItems,
    handleLoadDemoProduct,
    handleRunAgent,
    handleDownloadSingle,
    handleShare,
    handleLoadHistoryItem,
    handleDeleteHistoryItem,
    language,
    t,
  } = session;

  const [isBlueprintSheetOpen, setIsBlueprintSheetOpen] = useState(false);
  const [isAdvancedMobileOpen, setIsAdvancedMobileOpen] = useState(false);

  const hasPhotos = sourceImages.length > 0;
  const hasOutputs = generatedOutputs.length > 0 && !isGenerating;

  return (
    <div className="w-full min-h-[calc(100dvh-56px)] flex flex-col bg-studio-bg text-studio-text overflow-x-hidden relative">
      {/* Scrollable Container with plenty of bottom padding for sticky thumb bar */}
      <div className="flex-1 w-full px-3.5 py-4 space-y-4 pb-32">
        {/* Error Notice */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              aria-label="Tutup pesan error"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center font-semibold text-xs text-red-300 hover:text-white cursor-pointer shrink-0 ml-1"
            >
              {t.page.dismiss}
            </button>
          </div>
        )}

        {/* Demo Quota Exceeded Notice */}
        {quotaExceededNotice && (
          <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 text-xs text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="leading-snug">
                {language === "id"
                  ? "Batas antrean demo tercapai. Silakan coba sesaat lagi."
                  : "Demo queue limit reached. Please try again shortly."}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setQuotaExceededNotice(false)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center font-semibold text-xs text-amber-300 hover:text-white cursor-pointer shrink-0 ml-1"
            >
              {t.page.dismiss}
            </button>
          </div>
        )}

        {/* STEP 1: EMPTY STATE / UPLOAD ZONE */}
        {!hasPhotos && !isGenerating && !hasOutputs && (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-full card-studio p-4">
              <ProductSourceUpload
                variant="hero"
                images={sourceImages}
                onAddImages={(newImgs) =>
                  setSourceImages((prev) => [...prev, ...newImgs])
                }
                onRemoveImage={() => {}}
              />
            </div>

            {/* Quick Demo Action */}
            <div className="w-full flex items-center justify-center pt-2">
              <button
                type="button"
                id="mobile-empty-load-demo"
                onClick={handleLoadDemoProduct}
                className="w-full min-h-[48px] px-4 rounded-xl border border-studio-border bg-studio-card text-studio-text hover:bg-studio-subcard transition-all flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer active:scale-98"
              >
                <Sparkles className="w-4 h-4 text-zinc-100" />
                <span>
                  {language === "id"
                    ? "Coba dengan foto produk demo sepatu"
                    : "Try with demo footwear photo"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PHOTO UPLOADED, BEFORE GENERATION */}
        {hasPhotos && !isGenerating && !hasOutputs && (
          <div className="space-y-4">
            {/* 1. Uploaded Product Card */}
            <div className="card-studio p-3.5 space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold text-studio-text font-heading flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-100" />
                  <span>{language === "id" ? "Foto Produk Asli" : "Original Product"}</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{language === "id" ? "Terkunci" : "Locked"}</span>
                </span>
              </div>

              <ProductSourceUpload
                variant="compact"
                images={sourceImages}
                onAddImages={(newImgs) =>
                  setSourceImages((prev) => [...prev, ...newImgs])
                }
                onRemoveImage={(id) => {
                  setSourceImages((prev) => prev.filter((img) => img.id !== id));
                }}
              />
            </div>

            {/* 2. Gaya Latar Studio via Bottom Sheet */}
            <PresetPicker
              direction={direction}
              onChangeDirection={setDirection}
              variant="mobile"
            />

            {/* 3. Sudut Kamera Studio via Bottom Sheet */}
            <AngleSelector
              direction={direction}
              onChangeDirection={setDirection}
              variant="mobile"
            />

            {/* 4. Progressive Disclosure: Pengaturan Lanjutan */}
            <div className="card-studio p-3 space-y-3">
              <button
                type="button"
                onClick={() => setIsAdvancedMobileOpen(!isAdvancedMobileOpen)}
                className="w-full min-h-[44px] flex items-center justify-between text-xs font-semibold text-studio-text cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-studio-muted" />
                  <span>{language === "id" ? "Pengaturan Variasi & Rasio" : "Variations & Aspect Ratio"}</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-studio-muted transition-transform ${
                    isAdvancedMobileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isAdvancedMobileOpen && (
                <div className="pt-2 border-t border-studio-border space-y-3">
                  {/* Image Count */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-studio-muted block font-mono">
                      {language === "id" ? "Jumlah Variasi Foto" : "Variations Count"}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 4].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setGenerationCount(count)}
                          className={`min-h-[44px] rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                            generationCount === count
                              ? "bg-white text-zinc-950 font-bold border-white"
                              : "bg-studio-subcard text-studio-muted border-studio-border"
                          }`}
                        >
                          {count} {language === "id" ? "Foto" : "Photos"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-studio-muted block font-mono">
                      {language === "id" ? "Aspek Rasio" : "Aspect Ratio"}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["1:1", "4:5", "9:16"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setDirection({ ...direction, aspectRatio: r })}
                          className={`min-h-[44px] rounded-lg border text-xs font-semibold font-mono transition-colors cursor-pointer ${
                            direction.aspectRatio === r
                              ? "bg-studio-subcard border-zinc-200 text-white ring-1 ring-zinc-200 font-bold"
                              : "bg-studio-card text-studio-muted border-studio-border"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: GENERATION IN PROGRESS (Agent Monitor 4 Tahap Jujur) */}
        {isGenerating && (
          <div className="py-2">
            <AgentMonitor
              steps={pipelineSteps}
              isGenerating={isGenerating}
              hasStarted={hasStarted}
              blueprint={blueprint}
              onOpenBlueprint={() => setIsBlueprintSheetOpen(true)}
              onRetry={handleRunAgent}
              currentLogMessage={currentLogMessage}
            />
          </div>
        )}

        {/* STEP 4: GENERATION SUCCEEDED / RESULTS */}
        {hasOutputs && (
          <div className="space-y-4">
            <ResultViewer
              outputs={generatedOutputs}
              selectedIndex={selectedOutputIndex}
              onSelectIndex={setSelectedOutputIndex}
              sourceImage={sourceImages[0]}
              onDownload={handleDownloadSingle}
              onShare={handleShare}
              onRegenerate={handleRunAgent}
              onOpenBlueprint={() => setIsBlueprintSheetOpen(true)}
              isGenerating={isGenerating}
              variant="mobile"
              direction={direction}
            />

            {/* Quick action to edit scene settings again */}
            <div className="pt-2">
              <PresetPicker
                direction={direction}
                onChangeDirection={setDirection}
                variant="mobile"
              />
            </div>
          </div>
        )}
      </div>

      {/* STICKY BOTTOM THUMB BAR (ZONE JEMPOL) */}
      {hasPhotos && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-studio-bg/95 backdrop-blur-md border-t border-studio-border px-4 py-3 pb-safe shadow-studio-float">
          <button
            type="button"
            id="mobile-main-generate-btn"
            onClick={handleRunAgent}
            disabled={isGenerating || sourceImages.length === 0}
            aria-label={
              isGenerating
                ? "Sedang membuat foto studio"
                : `Buat foto produk studio (${generationCount} variasi)`
            }
            className="btn-primary w-full min-h-[50px] text-sm font-semibold flex items-center justify-center gap-2 rounded-xl shadow-md cursor-pointer active:scale-98 transition-all"
          >
            <Play className="w-4 h-4 fill-current shrink-0" />
            <span>
              {isGenerating
                ? (language === "id" ? "Memproses foto studio..." : "Generating studio shoot...")
                : hasOutputs
                ? (language === "id" ? `Buat variasi baru (${generationCount} foto)` : `Create new variation (${generationCount} photos)`)
                : (language === "id" ? `Buat foto studio (${generationCount} foto)` : `Create studio photo (${generationCount} photos)`)}
            </span>
          </button>
        </div>
      )}

      {/* Blueprint Mobile Sheet */}
      <BlueprintSheet
        blueprint={blueprint}
        isOpen={isBlueprintSheetOpen}
        onClose={() => setIsBlueprintSheetOpen(false)}
      />

      {/* History Bottom Sheet */}
      <HistoryDrawer
        history={historyItems}
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        onLoadItem={handleLoadHistoryItem}
        onDeleteItem={handleDeleteHistoryItem}
      />
    </div>
  );
}
