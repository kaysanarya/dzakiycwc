"use client";

import React, { useEffect } from "react";
import { Header } from "@/components/app-shell/Header";
import { useStudioSession } from "@/lib/hooks/useStudioSession";
import { StudioMobile } from "@/components/studio/StudioMobile";
import { StudioDesktop } from "@/components/studio/StudioDesktop";

export default function Home() {
  const session = useStudioSession();

  // Keyboard Shortcuts: Enter (Generate), ArrowLeft/ArrowRight (Cycle Variations), Esc (Close Modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "Enter") {
        if (
          !session.isGenerating &&
          session.sourceImages.length > 0 &&
          !session.isBlueprintModalOpen &&
          !session.isHistoryDrawerOpen
        ) {
          e.preventDefault();
          session.handleRunAgent();
        }
      } else if (e.key === "ArrowLeft") {
        if (session.generatedOutputs.length > 1 && session.selectedOutputIndex > 0) {
          e.preventDefault();
          session.setSelectedOutputIndex(session.selectedOutputIndex - 1);
        }
      } else if (e.key === "ArrowRight") {
        if (
          session.generatedOutputs.length > 1 &&
          session.selectedOutputIndex < session.generatedOutputs.length - 1
        ) {
          e.preventDefault();
          session.setSelectedOutputIndex(session.selectedOutputIndex + 1);
        }
      } else if (e.key === "Escape") {
        session.setIsBlueprintModalOpen(false);
        session.setIsHistoryDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    session.isGenerating,
    session.sourceImages.length,
    session.generatedOutputs.length,
    session.selectedOutputIndex,
    session.isBlueprintModalOpen,
    session.isHistoryDrawerOpen,
    session,
  ]);

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans bg-studio-bg text-studio-text overflow-x-hidden selection:bg-studio-accent/30 selection:text-white">
      {/* Top Header */}
      <Header
        onLoadDemoProduct={session.handleLoadDemoProduct}
        onOpenHistory={() => {
          if (typeof window !== "undefined" && window.innerWidth >= 1024) {
            session.setIsRightSidebarOpen((prev) => !prev);
          } else {
            session.setIsHistoryDrawerOpen(true);
          }
        }}
        isHistoryOpen={session.isRightSidebarOpen}
        hasApiKey={true}
        activeProviderName="gemini"
        historyCount={session.historyItems.length}
        demoRemaining={session.demoRemaining}
      />

      {/* MOBILE LAYOUT (<1024px, base 390px, clean down to 360px) */}
      <div className="block lg:hidden w-full flex-1 flex flex-col min-h-0">
        <StudioMobile session={session} />
      </div>

      {/* DESKTOP LAYOUT (>=1024px, optimal 1440px) */}
      <div className="hidden lg:flex w-full flex-1 flex-col min-h-0">
        <StudioDesktop session={session} />
      </div>
    </div>
  );
}
