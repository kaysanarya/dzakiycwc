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
      className="fixed inset-0 z-50 bg-[#00030a]/60 backdrop-blur-md flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white/[0.04] backdrop-blur-2xl h-full shadow-2xl flex flex-col border-l border-white/[0.08]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.03] backdrop-blur-md">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              {t.history.title}
            </h3>
            <p className="text-xs text-white/60 mt-0.5 font-medium">
              {language === "id"
                ? "Tinjau arahan dan hasil fotografi sebelumnya"
                : "Review past photography directions and outputs"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="liquid-glass-btn p-1.5 rounded-full text-white/60 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of past sessions */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-white/60">
              <Layers className="w-8 h-8 text-[#3781fc]/70 mb-2" />
              <p className="text-xs font-bold text-white">{t.history.noHistory}</p>
              <p className="text-[11px] text-[#3781fc]/70 mt-0.5 font-medium">
                {t.history.noHistoryDesc}
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="liquid-glass-subcard border border-white/[0.08] rounded-2xl p-4 space-y-2.5 hover:border-white shadow-2xs transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate max-w-[200px]">
                    {item.projectName}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                    {item.averageScore}% {language === "id" ? "Cocok" : "Match"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-white/60 font-medium">
                  <Calendar className="w-3 h-3 text-[#1951fc]" />
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="capitalize">{item.category}</span>
                  <span>•</span>
                  <span>{item.outputs.length} {language === "id" ? "foto" : "photos"}</span>
                </div>

                {/* Thumbnails preview */}
                <div className="flex gap-2 pt-1">
                  {item.outputs.slice(0, 4).map((out, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-hidden shadow-2xs"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={out.imageUrl}
                        alt="thumb"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      onLoadItem(item);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#60a5fa] hover:text-white cursor-pointer transition-colors"
                  >
                    <span>{language === "id" ? "Muat ke Ruang Kerja" : "Load into Workspace"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-white/[0.05] transition-colors cursor-pointer"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
