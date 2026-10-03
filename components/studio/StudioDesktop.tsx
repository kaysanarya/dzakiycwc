"use client";

import React, { useState } from "react";
import { StudioSession } from "@/lib/hooks/useStudioSession";
import { ProductSourceUpload } from "@/components/upload/ProductSourceUpload";
import { ReferenceUpload } from "@/components/upload/ReferenceUpload";
import { ProductSpec } from "@/components/product-spec/ProductSpec";
import { ProductLocks } from "@/components/product-lock/ProductLocks";
import { PresetPicker } from "@/components/studio/PresetPicker";
import { AngleSelector } from "@/components/studio/AngleSelector";
import { ResultViewer } from "@/components/studio/ResultViewer";
import { AgentMonitor } from "@/components/agent-monitor/AgentMonitor";
import { BlueprintModal } from "@/components/blueprint/BlueprintModal";
import {
  Play,
  Sparkles,
  AlertTriangle,
  Sliders,
  ChevronDown,
  Layers,
  Clock,
  ChevronRight,
  ChevronLeft,
  Download,
  Ratio,
} from "lucide-react";

interface StudioDesktopProps {
  session: StudioSession;
}

export function StudioDesktop({ session }: StudioDesktopProps) {
  const {
    sourceImages,
    setSourceImages,
    referenceImages,
    setReferenceImages,
    category,
    setCategory,
    locks,
    setLocks,
    direction,
    setDirection,
    generationCount,
    setGenerationCount,
    isAdvancedOpen,
    setIsAdvancedOpen,
    isRightSidebarOpen,
    setIsRightSidebarOpen,
    isGenerating,
    hasStarted,
    pipelineSteps,
    currentLogMessage,
    blueprint,
    generatedOutputs,
    selectedOutputIndex,
    setSelectedOutputIndex,
    isBlueprintModalOpen,
    setIsBlueprintModalOpen,
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
    language,
    t,
  } = session;

  const [_activeTab] = useState<"standard" | "advanced">("standard");

  const hasPhotos = sourceImages.length > 0;
  const primarySourceImage = sourceImages[0];

  return (
    <div className="flex-1 flex w-full max-w-[1560px] mx-auto h-[calc(100vh-56px)] overflow-hidden bg-studio-bg text-studio-text select-none">
      {/* ========================================================= */}
      {/* 1. LEFT CONTROL PANEL (320px Sticky)                      */}
      {/* ========================================================= */}
      <aside className="w-[320px] min-w-[320px] max-w-[320px] border-r border-studio-border bg-studio-bg flex flex-col h-full shrink-0">
        {/* Scrollable control items */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
          {/* 1. Upload Produk */}
          <div className="card-studio p-3 space-y-2">
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

          {/* 2. Controls revealed when photos are present */}
          {hasPhotos && (
            <>
              {/* Preset Latar Studio */}
              <div className="card-studio p-3">
                <PresetPicker
                  direction={direction}
                  onChangeDirection={setDirection}
                  variant="desktop"
                />
              </div>

              {/* Sudut Kamera Studio */}
              <div className="card-studio p-3">
                <AngleSelector
                  direction={direction}
                  onChangeDirection={setDirection}
                  variant="desktop"
                />
              </div>

              {/* Rasio Aspek */}
              <div className="card-studio p-3 space-y-2">
                <label className="text-xs font-semibold text-studio-text flex items-center gap-1.5 font-heading">
                  <Ratio className="w-3.5 h-3.5 text-studio-muted" />
                  <span>{language === "id" ? "Rasio Ukuran" : "Aspect Ratio"}</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["1:1", "4:5", "9:16"] as const).map((r) => {
                    const isSelected = direction.aspectRatio === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setDirection({ ...direction, aspectRatio: r })}
                        className={`py-2 px-1 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? "bg-studio-subcard border-studio-accent text-studio-text ring-1 ring-studio-accent/70 font-bold"
                            : "bg-studio-card/60 text-studio-muted hover:text-studio-text border-studio-border"
                        }`}
                      >
                        <span className="text-xs font-mono font-bold">{r}</span>
                        <span className="text-[9px] text-studio-dim truncate max-w-full">
                          {r === "1:1" ? "Feed" : r === "4:5" ? "Portrait" : "Story"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pengaturan Lanjutan (Progressive Disclosure) */}
              <div className="card-studio p-3 space-y-3">
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  aria-expanded={isAdvancedOpen}
                  aria-label="Buka tutup pengaturan lanjutan"
                  className="w-full flex items-center justify-between text-xs font-semibold text-studio-text hover:text-studio-accent transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-studio-muted" />
                    <span>{language === "id" ? "Pengaturan Lanjutan" : "Advanced Settings"}</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-studio-muted transition-transform ${
                      isAdvancedOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isAdvancedOpen && (
                  <div className="pt-2 border-t border-studio-border space-y-3.5">
                    {/* Product Spec */}
                    <ProductSpec
                      category={category}
                      onChangeCategory={(cat) => setCategory(cat)}
                      detectedLabel={
                        blueprint?.category === "footwear"
                          ? "sepatu hak"
                          : blueprint?.subcategory
                      }
                    />

                    {/* Product Lock Toggle */}
                    <ProductLocks locks={locks} onChangeLocks={setLocks} />

                    {/* Output Count */}
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-xs font-semibold text-studio-text font-mono">
                        {language === "id" ? "Jumlah Variasi Foto" : "Image Count"}
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[1, 2, 4].map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => setGenerationCount(count)}
                            className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                              generationCount === count
                                ? "bg-studio-accent text-studio-bg font-bold border-studio-accent"
                                : "bg-studio-card text-studio-muted hover:text-studio-text border-studio-border"
                            }`}
                          >
                            {count} {language === "id" ? "Foto" : "Photos"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Optional Reference Upload */}
                    <div className="pt-2 border-t border-studio-border">
                      <ReferenceUpload
                        references={referenceImages}
                        onAddReferences={(newRefs) => {
                          setReferenceImages((prev) => [...prev, ...newRefs]);
                          setDirection((prev) => ({
                            ...prev,
                            background: "exact_reference",
                            cameraAngle: "copy_reference",
                          }));
                        }}
                        onRemoveReference={(id) => {
                          setReferenceImages((prev) => {
                            const updated = prev.filter((img) => img.id !== id);
                            if (updated.length === 0) {
                              setDirection((d) => ({
                                ...d,
                                background: "studio_beige",
                                cameraAngle: "three_quarter",
                              }));
                            }
                            return updated;
                          });
                        }}
                        onSetCameraAngleToReference={() => {
                          setDirection((prev) => ({
                            ...prev,
                            cameraAngle: "copy_reference",
                            background: "exact_reference",
                          }));
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sticky Action Button at bottom */}
        <div className="p-3 border-t border-studio-border bg-studio-bg/95 sticky bottom-0 z-10">
          <button
            type="button"
            id="desktop-main-generate-btn"
            onClick={handleRunAgent}
            disabled={isGenerating || sourceImages.length === 0}
            aria-label={
              isGenerating
                ? "Sedang membuat foto produk studio"
                : `Buat foto studio (${generationCount} gambar)`
            }
            className="btn-primary w-full h-11 text-xs font-semibold flex items-center justify-center gap-2 rounded-xl shadow-md cursor-pointer transition-all"
          >
            <Play className="w-4 h-4 fill-current shrink-0" />
            <span>
              {isGenerating
                ? (language === "id" ? "Memproses foto studio..." : "Generating studio shoot...")
                : (language === "id" ? `Buat foto (${generationCount} gambar)` : `Create photo (${generationCount} images)`)}
            </span>
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. CENTER CANVAS (Dominant Result Viewport)               */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col min-h-0 h-full overflow-y-auto p-6 bg-studio-bg">
        {/* Error Notice */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="font-semibold underline hover:text-white cursor-pointer ml-3"
            >
              {t.page.dismiss}
            </button>
          </div>
        )}

        {/* Quota Notice */}
        {quotaExceededNotice && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-800 text-xs text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {language === "id"
                  ? "Batas antrean demo tercapai. Silakan coba kembali sesaat lagi."
                  : "Demo queue limit reached. Please try again shortly."}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setQuotaExceededNotice(false)}
              className="font-semibold underline hover:text-white cursor-pointer ml-3"
            >
              {t.page.dismiss}
            </button>
          </div>
        )}

        {/* STATE 0: EMPTY STATE */}
        {sourceImages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
            <ProductSourceUpload
              variant="hero"
              images={sourceImages}
              onAddImages={(newImgs) =>
                setSourceImages((prev) => [...prev, ...newImgs])
              }
              onRemoveImage={() => {}}
            />

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                id="desktop-empty-load-demo"
                onClick={handleLoadDemoProduct}
                className="btn-secondary h-9 px-4 text-xs gap-1.5 rounded-lg border-studio-border"
              >
                <Sparkles className="w-3.5 h-3.5 text-studio-accent" />
                <span>
                  {language === "id"
                    ? "Atau muat contoh produk demo sepatu"
                    : "Or load demo footwear product"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 1: UPLOADED, BEFORE GENERATION */}
        {sourceImages.length > 0 && generatedOutputs.length === 0 && !isGenerating && (
          <div className="flex-1 flex flex-col justify-center max-w-4xl w-full mx-auto space-y-4 py-4">
            <div className="flex items-center justify-between border-b border-studio-border pb-3">
              <div>
                <h2 className="text-sm font-semibold text-studio-text font-heading">
                  {language === "id"
                    ? "Pratinjau Foto Asli & Potongan Produk"
                    : "Original Photo & Cutout Inspection"}
                </h2>
                <p className="text-xs text-studio-muted mt-0.5">
                  {language === "id"
                    ? "Piksel dan bentuk fisik produk asli dikunci sebelum sistem membuat tata cahaya studio komersial."
                    : "Original product pixels and geometry are locked before studio lighting is generated."}
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-studio-card border border-studio-border text-[11px] text-studio-muted font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{language === "id" ? "Produk Terkunci" : "Product Locked"}</span>
              </div>
            </div>

            {/* Side-by-side inspection grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Raw Photo */}
              <div className="card-studio overflow-hidden flex flex-col">
                <div className="p-2.5 border-b border-studio-border flex items-center justify-between bg-studio-card/80">
                  <span className="text-xs font-semibold text-studio-text font-heading">
                    {language === "id" ? "Foto Mentah Asli" : "Original Raw Photo"}
                  </span>
                  <span className="text-[10px] text-studio-dim font-mono">
                    {primarySourceImage?.width && primarySourceImage?.height
                      ? `${primarySourceImage.width}×${primarySourceImage.height}px`
                      : "Source"}
                  </span>
                </div>
                <div className="relative aspect-square w-full bg-studio-bg flex items-center justify-center p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primarySourceImage?.dataUrl}
                    alt="Foto mentah produk asli"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Cutout Mask */}
              <div className="card-studio overflow-hidden flex flex-col">
                <div className="p-2.5 border-b border-studio-border flex items-center justify-between bg-studio-card/80">
                  <span className="text-xs font-semibold text-studio-text flex items-center gap-1.5 font-heading">
                    <Layers className="w-3.5 h-3.5 text-studio-accent" />
                    <span>{language === "id" ? "Potongan Produk (Mask)" : "Product Cutout (Mask)"}</span>
                  </span>
                  <span className="text-[10px] text-studio-muted bg-studio-subcard px-1.5 py-0.5 rounded border border-studio-border font-mono">
                    {language === "id" ? "Piksel Asli Terkunci" : "Authentic Pixels Locked"}
                  </span>
                </div>
                <div
                  className="relative aspect-square w-full flex items-center justify-center p-3 bg-studio-bg"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, #1c1d20 25%, transparent 25%), linear-gradient(-45deg, #1c1d20 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1c1d20 75%), linear-gradient(-45deg, transparent 75%, #1c1d20 75%)",
                    backgroundSize: "16px 16px",
                    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primarySourceImage?.dataUrl}
                    alt="Pratinjau potongan produk"
                    className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]"
                  />
                </div>
              </div>
            </div>

            {/* Action Banner to proceed */}
            <div className="card-studio-subtle p-3 rounded-xl flex items-center justify-between text-xs">
              <span className="text-studio-muted">
                {language === "id"
                  ? "Pilih preset latar dan rasio di panel kiri, lalu klik tombol 'Buat foto'."
                  : "Choose backdrop preset and ratio on the left, then click 'Create photo'."}
              </span>
              <button
                type="button"
                onClick={handleRunAgent}
                className="btn-primary h-8 px-3.5 text-xs gap-1.5 shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{language === "id" ? "Buat foto sekarang" : "Create photo now"}</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 2: GENERATION IN PROGRESS */}
        {isGenerating && (
          <div className="flex-1 flex flex-col justify-center max-w-2xl w-full mx-auto py-6">
            <AgentMonitor
              steps={pipelineSteps}
              isGenerating={isGenerating}
              hasStarted={hasStarted}
              blueprint={blueprint}
              onOpenBlueprint={() => setIsBlueprintModalOpen(true)}
              onRetry={handleRunAgent}
              currentLogMessage={currentLogMessage}
            />
          </div>
        )}

        {/* STATE 3: RESULTS (HERO BEFORE/AFTER SLIDER + VARIATIONS DOCK) */}
        {generatedOutputs.length > 0 && !isGenerating && (
          <ResultViewer
            outputs={generatedOutputs}
            selectedIndex={selectedOutputIndex}
            onSelectIndex={setSelectedOutputIndex}
            sourceImage={primarySourceImage}
            onDownload={handleDownloadSingle}
            onShare={handleShare}
            onRegenerate={handleRunAgent}
            onOpenBlueprint={() => setIsBlueprintModalOpen(true)}
            isGenerating={isGenerating}
            variant="desktop"
            direction={direction}
          />
        )}
      </main>

      {/* ========================================================= */}
      {/* 3. RIGHT PANEL (Collapsible History 240px)                */}
      {/* ========================================================= */}
      <aside
        className={`flex flex-col border-l border-studio-border bg-studio-bg h-full transition-all duration-200 shrink-0 ${
          isRightSidebarOpen
            ? "w-[240px] min-w-[240px] max-w-[240px]"
            : "w-[44px] min-w-[44px] max-w-[44px]"
        }`}
      >
        {isRightSidebarOpen ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-3 border-b border-studio-border flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-studio-muted" />
                <span className="text-xs font-semibold text-studio-text font-heading">
                  {language === "id" ? "Riwayat Hasil" : "History"}
                </span>
                <span className="text-[10px] font-mono text-studio-accent bg-studio-card px-1.5 py-0.5 rounded border border-studio-border">
                  {historyItems.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsRightSidebarOpen(false)}
                aria-label="Lipat panel riwayat"
                className="p-1 rounded text-studio-muted hover:text-studio-text hover:bg-studio-card cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* History list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {historyItems.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-studio-muted">
                  <Clock className="w-6 h-6 mb-2 stroke-[1.5] text-studio-dim" />
                  <p className="text-xs font-medium text-studio-text">{t.history.noHistory}</p>
                  <p className="text-[10px] text-studio-dim mt-0.5">{t.history.noHistoryDesc}</p>
                </div>
              ) : (
                historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="card-studio-subtle p-2 rounded-xl space-y-1.5 hover:border-studio-default transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-studio-text truncate max-w-[120px] font-heading">
                        {item.projectName}
                      </span>
                      <span className="text-[9px] font-mono text-studio-dim">
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Output thumb */}
                    <div className="flex items-center gap-1.5">
                      {item.outputs.slice(0, 3).map((out, oIdx) => (
                        <div
                          key={oIdx}
                          className="w-12 h-12 rounded-lg bg-studio-bg border border-studio-border overflow-hidden shrink-0 flex items-center justify-center"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={out.imageUrl}
                            alt="output thumbnail"
                            className="w-full h-full object-contain p-0.5"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-studio-border text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleLoadHistoryItem(item)}
                        className="text-studio-accent hover:text-studio-text font-medium cursor-pointer"
                      >
                        {language === "id" ? "Lihat" : "View"}
                      </button>
                      {item.outputs[0] && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadSingle(
                              item.outputs[0].imageUrl,
                              item.projectName,
                              "png"
                            )
                          }
                          className="text-studio-muted hover:text-studio-text inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-2.5 h-2.5" />
                          <span>PNG</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Collapsed narrow strip */
          <div className="flex flex-col items-center py-3 h-full">
            <button
              type="button"
              onClick={() => setIsRightSidebarOpen(true)}
              aria-label="Buka panel riwayat"
              className="p-1.5 rounded text-studio-muted hover:text-studio-text hover:bg-studio-card cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="mt-4 [writing-mode:vertical-rl] rotate-180 flex items-center gap-2 text-xs font-medium text-studio-dim">
              <Clock className="w-3.5 h-3.5 rotate-90 text-studio-muted" />
              <span>{language === "id" ? "Riwayat Hasil" : "History"}</span>
            </div>
          </div>
        )}
      </aside>

      {/* Blueprint Modal on Desktop */}
      <BlueprintModal
        blueprint={blueprint}
        isOpen={isBlueprintModalOpen}
        onClose={() => setIsBlueprintModalOpen(false)}
      />
    </div>
  );
}
