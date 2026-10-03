"use client";

import React, { useRef, useState } from "react";
import { UploadedImage } from "@/types";
import { Upload, X, ShieldAlert, Scissors, Compass } from "lucide-react";
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
    <div className="space-y-3 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight uppercase flex items-center gap-2">
            <span>{language === "id" ? "Foto Referensi (Opsional)" : "Reference Photos (Optional)"}</span>
            <span className="text-[10px] font-semibold text-[#3781fc] bg-[#1951fc]/20 px-2 py-0.5 rounded-full border border-white/[0.08]">
              Style Only
            </span>
          </h3>
          <p className="text-xs text-white/70 mt-0.5 font-medium">
            {language === "id"
              ? "Referensi hanya digunakan untuk style fotografi. Identitas produk tetap mengikuti foto mentahan."
              : "References are used for photography style only. Product identity strictly follows raw photos."}
          </p>
        </div>
        <span className="text-xs font-semibold text-[#3781fc] self-start sm:self-auto bg-white/[0.05] px-2.5 py-1 rounded-full border border-white/[0.08]">
          {references.length} {language === "id" ? "referensi" : references.length === 1 ? "reference" : "references"}
        </span>
      </div>

      {/* Prominent Warning Banner */}
      <div className="p-3 rounded-lg border border-amber-800/60 bg-amber-950/30 flex items-start gap-2.5 text-xs text-amber-200">
        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
        <div className="leading-relaxed">
          <p className="font-semibold text-amber-200">
            {language === "id"
              ? "Referensi hanya memengaruhi arahan fotografi (lighting, angle, background)."
              : "Reference images influence photography direction only (lighting, angle, background)."}
          </p>
          <p className="text-amber-200/80 text-[11px] mt-0.5 font-normal">
            {language === "id"
              ? "Identitas produk tetap mengikuti foto mentahan. AI VELLUM tidak akan pernah meminjam bentuk geometri atau komponen dari referensi ini."
              : "Product identity strictly adheres to raw product images. VELLUM AI will never borrow geometry or parts from references."}
          </p>
        </div>
      </div>

      {/* Mini Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${dragActive
            ? "border-blue-500 bg-blue-950/30"
            : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/50 hover:bg-zinc-900"
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
          <Upload className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-medium">
            {language === "id"
              ? "Unggah gambar referensi untuk pencahayaan, komposisi, atau background"
              : "Upload reference images for lighting, composition, or background"}
          </span>
        </div>
      </div>

      {/* Reference thumbnails with action buttons */}
      {references.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {references.map((ref) => {
            const isBgRemoved = Boolean(removedBgIds[ref.id]);
            const isUsingAngle = Boolean(useAngleIds[ref.id]);

            return (
              <div
                key={ref.id}
                className="card-flat-subtle rounded-lg p-2.5 flex flex-col justify-between hover:border-zinc-700 transition-colors"
              >
                <div className="relative aspect-video w-full rounded-md bg-zinc-950 overflow-hidden flex items-center justify-center border border-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ref.dataUrl}
                    alt={ref.name}
                    className={`w-full h-full object-cover transition-all ${isBgRemoved ? "filter contrast-125 brightness-105" : ""
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveReference(ref.id)}
                    aria-label={language === "id" ? "Hapus referensi" : "Remove reference"}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
                    title={language === "id" ? "Hapus Referensi" : "Remove Reference"}
                  >
                    <X className="w-3 h-3" />
                  </button>

                  {isBgRemoved && (
                    <div className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                      BG Filtered
                    </div>
                  )}
                </div>

                {/* Reference Action Buttons */}
                <div className="mt-2 flex items-center gap-1.5 justify-between pt-1 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => toggleRemoveBg(ref.id)}
                    className={`flex-1 py-1 px-2 text-[10px] font-medium rounded border transition-colors flex items-center justify-center gap-1 cursor-pointer ${isBgRemoved
                        ? "bg-blue-600 text-white border-blue-500"
                        : "btn-secondary"
                      }`}
                    title="Abaikan background referensi agar fokus pada pencahayaan produk"
                  >
                    <Scissors className="w-3 h-3" />
                    <span>{isBgRemoved ? "BG Dihapus ✓" : "Hapus BG"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleUseAngle(ref.id)}
                    className={`flex-1 py-1 px-2 text-[10px] font-medium rounded border transition-colors flex items-center justify-center gap-1 cursor-pointer ${isUsingAngle
                        ? "bg-blue-600 text-white border-blue-500"
                        : "btn-secondary"
                      }`}
                    title="Gunakan sudut kamera dari referensi ini"
                  >
                    <Compass className="w-3 h-3" />
                    <span>{isUsingAngle ? "Angle Aktif ✓" : "Gunakan Angle"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
