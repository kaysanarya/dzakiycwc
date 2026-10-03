"use client";

import React, { useRef, useState } from "react";
import { UploadedImage } from "@/types";
import { Upload, X, Sparkles, Image as ImageIcon, Compass, Eye } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ReferenceUploadProps {
  references: UploadedImage[];
  onAddReferences: (newImages: UploadedImage[]) => void;
  onRemoveReference: (id: string) => void;
  onSetCameraAngleToReference?: () => void;
}

export function ReferenceUpload({
  references,
  onAddReferences,
  onRemoveReference,
  onSetCameraAngleToReference,
}: ReferenceUploadProps) {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [removedBgIds, setRemovedBgIds] = useState<Record<string, boolean>>({});
  const [useAngleIds, setUseAngleIds] = useState<Record<string, boolean>>({});
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);

  const processFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (validFiles.length === 0) return;

    const newItems: UploadedImage[] = [];
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newItems.push({
          id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          dataUrl: e.target?.result as string,
          size: file.size,
          type: file.type,
          tag: "general",
        });
        if (newItems.length === validFiles.length) {
          onAddReferences(newItems);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const toggleRemoveBg = (id: string) => {
    setRemovedBgIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleUseAngle = (id: string) => {
    const nextVal = !useAngleIds[id];
    setUseAngleIds((prev) => ({ ...prev, [id]: nextVal }));
    if (nextVal && onSetCameraAngleToReference) {
      onSetCameraAngleToReference();
    }
  };

  return (
    <div className="space-y-2.5 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-zinc-200">
            {language === "id" ? "Foto Referensi" : "Reference Photos"}
          </label>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
            {language === "id" ? "Opsional" : "Optional"}
          </span>
        </div>
        {references.length > 0 && (
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            {references.length} {language === "id" ? "referensi" : references.length === 1 ? "ref" : "refs"}
          </span>
        )}
      </div>

      {/* Sleek Utilitarian Notice Banner */}
      <div className="rounded-md border border-zinc-800/90 bg-zinc-900/40 px-3 py-2 flex items-start gap-2.5 text-zinc-400">
        <Sparkles className="w-3.5 h-3.5 shrink-0 text-zinc-400 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-zinc-400">
          {language === "id"
            ? "Referensi hanya memandu pencahayaan & suasana studio. Fisik produk tetap 100% autentik dari foto mentah."
            : "References guide studio lighting & backdrop mood only. Product physical identity remains strictly authentic."}
        </p>
      </div>

      {/* Mini Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            fileInputRef.current?.click();
          }
        }}
        className={`border border-dashed rounded-lg py-2.5 px-3 text-center cursor-pointer transition-all ${
          dragActive
            ? "border-zinc-400 bg-zinc-800/30"
            : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/60"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.svg"
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-300">
          <Upload className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="font-medium text-zinc-300">
            {language === "id"
              ? "Unggah referensi lighting / background"
              : "Upload reference for lighting / backdrop"}
          </span>
        </div>
      </div>

      {/* Reference Card List (Vertical, Non-overlapping, Precise Pro Studio Design) */}
      {references.length > 0 && (
        <div className="space-y-2 pt-0.5">
          {references.map((ref) => {
            const isBgIgnored = Boolean(removedBgIds[ref.id]);
            const isUsingAngle = Boolean(useAngleIds[ref.id]);

            return (
              <div
                key={ref.id}
                className="rounded-lg border border-zinc-800/90 bg-zinc-900/40 p-2.5 hover:border-zinc-700/80 transition-all flex flex-col gap-2"
              >
                {/* Top Row: Thumbnail + Meta + Controls */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    onClick={() => setPreviewImage(ref)}
                    className="relative w-12 h-12 rounded bg-zinc-950 border border-zinc-800/80 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer group"
                    title={language === "id" ? "Klik untuk melihat pratinjau" : "Click to preview"}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ref.dataUrl}
                      alt={ref.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="w-3.5 h-3.5 text-zinc-200" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-zinc-200 truncate" title={ref.name}>
                      {ref.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {ref.size ? `${(ref.size / 1024).toFixed(0)} KB` : "Style Ref"}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-[10px] text-zinc-400">
                        {isBgIgnored
                          ? language === "id" ? "Hanya Cahaya" : "Lighting Only"
                          : language === "id" ? "Latar & Cahaya" : "Scene & Mood"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveReference(ref.id)}
                    aria-label={language === "id" ? "Hapus referensi" : "Remove reference"}
                    className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800/60 transition-colors cursor-pointer shrink-0"
                    title={language === "id" ? "Hapus Referensi" : "Remove Reference"}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bottom Row: 2 Balanced Toggle Pills (Never collides or overflows) */}
                <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-zinc-800/60">
                  <button
                    type="button"
                    onClick={() => toggleRemoveBg(ref.id)}
                    className={`h-7 px-2 text-[11px] font-medium rounded-md border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      !isBgIgnored
                        ? "bg-zinc-800 text-zinc-100 border-zinc-700 shadow-sm"
                        : "bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:bg-zinc-900 hover:text-zinc-300"
                    }`}
                    title={
                      language === "id"
                        ? "Gunakan latar belakang dan tekstur dari foto referensi ini"
                        : "Use background scene from this reference"
                    }
                  >
                    <ImageIcon className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {!isBgIgnored
                        ? language === "id" ? "Latar Aktif" : "Scene Active"
                        : language === "id" ? "Abaikan Latar" : "Ignore Scene"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleUseAngle(ref.id)}
                    className={`h-7 px-2 text-[11px] font-medium rounded-md border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isUsingAngle
                        ? "bg-zinc-800 text-zinc-100 border-zinc-700 shadow-sm"
                        : "bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:bg-zinc-900 hover:text-zinc-300"
                    }`}
                    title={
                      language === "id"
                        ? "Gunakan sudut kamera dan elevasi dari referensi ini"
                        : "Match camera elevation and angle from reference"
                    }
                  >
                    <Compass className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {isUsingAngle
                        ? language === "id" ? "Angle Aktif" : "Angle Active"
                        : language === "id" ? "Gunakan Angle" : "Use Angle"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Preview */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
              <span className="text-xs font-medium text-zinc-200 truncate">
                {previewImage.name}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.dataUrl}
              alt={previewImage.name}
              className="w-full max-h-[70vh] object-contain rounded-lg bg-zinc-950"
            />
          </div>
        </div>
      )}
    </div>
  );
}
