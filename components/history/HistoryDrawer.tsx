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
        className="w-full max-w-md bg-zinc-950 h-full shadow-2xl flex flex-col border-l border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              {t.history.title}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {language === "id"
                ? "Tinjau arahan dan hasil fotografi sebelumnya"
                : "Review past photography directions and outputs"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup riwayat"
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of past sessions */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-zinc-400">
              <Layers className="w-8 h-8 text-zinc-600 mb-2" />
              <p className="text-xs font-semibold text-zinc-200">{t.history.noHistory}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {t.history.noHistoryDesc}
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="card-flat-subtle p-3.5 space-y-2.5 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200 truncate max-w-[200px]">
                    {item.projectName}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {item.averageScore}% {language === "id" ? "Cocok" : "Match"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  <Calendar className="w-3 h-3 text-zinc-500" />
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
                      className="w-12 h-12 rounded-md bg-zinc-900 border border-zinc-800 overflow-hidden"
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
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      onLoadItem(item);
                      onClose();
                    }}
                    aria-label={`Muat sesi ${item.projectName} ke ruang kerja`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer transition-colors"
                  >
                    <span>{language === "id" ? "Muat ke Ruang Kerja" : "Load into Workspace"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    aria-label={`Hapus sesi ${item.projectName}`}
                    className="p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
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
