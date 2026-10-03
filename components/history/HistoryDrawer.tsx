"use client";

import React from "react";
import { GenerationHistoryItem } from "@/types";
import { X, Calendar, Layers, Trash2, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface HistoryDrawerProps {
  history: GenerationHistoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onLoadItem: (item: GenerationHistoryItem) => void;
  onDeleteItem: (id: string) => void;
}

export function HistoryDrawer({
  history,
  isOpen,
  onClose,
  onLoadItem,
  onDeleteItem,
}: HistoryDrawerProps) {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex flex-col justify-end lg:justify-start lg:flex-row lg:justify-end"
      onClick={onClose}
    >
      <div
        className="w-full lg:max-w-md bg-studio-bg max-h-[85dvh] lg:max-h-none lg:h-full shadow-2xl flex flex-col border-t lg:border-t-0 lg:border-l border-studio-border rounded-t-2xl lg:rounded-none overflow-hidden pb-safe lg:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle indicator */}
        <div className="pt-3 flex justify-center lg:hidden">
          <div className="w-10 h-1 rounded-full bg-studio-border" />
        </div>

        {/* Drawer Header */}
        <div className="p-4 border-b border-studio-border flex items-center justify-between bg-studio-card">
          <div>
            <h3 className="text-sm font-semibold text-studio-text font-heading">
              {t.history.title}
            </h3>
            <p className="text-xs text-studio-muted mt-0.5">
              {language === "id"
                ? "Tinjau arahan dan hasil fotografi sebelumnya"
                : "Review past photography directions and outputs"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup riwayat"
            className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-studio-muted hover:text-studio-text hover:bg-studio-subcard cursor-pointer transition-colors flex items-center justify-center border border-studio-border/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of past sessions */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-studio-muted">
              <Layers className="w-8 h-8 text-studio-dim mb-2" />
              <p className="text-xs font-semibold text-studio-text">{t.history.noHistory}</p>
              <p className="text-[11px] text-studio-muted mt-0.5">
                {t.history.noHistoryDesc}
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="card-studio-subtle p-3.5 space-y-2.5 hover:border-studio-default transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-studio-text truncate max-w-[200px] font-heading">
                    {item.projectName}
                  </span>
                  <span className="text-[10px] font-mono text-studio-accent bg-studio-bg px-2 py-0.5 rounded border border-studio-border">
                    {item.averageScore}% {language === "id" ? "Cocok" : "Match"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-studio-muted">
                  <Calendar className="w-3 h-3 text-studio-dim" />
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="capitalize">{item.category}</span>
                  <span>•</span>
                  <span>{item.outputs.length} {language === "id" ? "foto" : "photos"}</span>
                </div>

                {/* Grid Thumbnails preview */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {item.outputs.slice(0, 4).map((out, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg bg-studio-bg border border-studio-border overflow-hidden"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={out.imageUrl}
                        alt="thumb"
                        className="w-full h-full object-contain p-1"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>

                {/* Action buttons with min 44px touch targets */}
                <div className="flex items-center justify-between pt-2 border-t border-studio-border">
                  <button
                    type="button"
                    onClick={() => {
                      onLoadItem(item);
                      onClose();
                    }}
                    aria-label={`Muat sesi ${item.projectName} ke ruang kerja`}
                    className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-medium text-studio-accent hover:text-studio-text cursor-pointer transition-colors"
                  >
                    <span>{language === "id" ? "Muat ke Ruang Kerja" : "Load into Workspace"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    aria-label={`Hapus sesi ${item.projectName}`}
                    className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-studio-muted hover:text-rose-400 hover:bg-studio-subcard transition-colors cursor-pointer flex items-center justify-center"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
