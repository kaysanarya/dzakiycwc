"use client";

import React, { useRef, useState } from "react";
import { UploadedImage } from "@/types";
import { Upload, X, Eye, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ProductSourceUploadProps {
  images: UploadedImage[];
  onAddImages: (newImages: UploadedImage[]) => void;
  onRemoveImage: (id: string) => void;
  onUpdateTag?: (id: string, tag: UploadedImage["tag"]) => void;
  variant?: "hero" | "compact";
  className?: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ProductSourceUpload({
  images,
  onAddImages,
  onRemoveImage,
  onUpdateTag: _onUpdateTag,
  variant = "compact",
  className = "",
}: ProductSourceUploadProps) {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);

  const processFiles = (files: FileList | File[]) => {
    setErrorMessage(null);
    const newItems: UploadedImage[] = [];

    const validFiles = Array.from(files).filter((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const validExtensions = ["jpg", "jpeg", "png", "webp", "svg"];
      if (!ext || !validExtensions.includes(ext)) {
        setErrorMessage(
          language === "id"
            ? `Format "${file.name}" tidak didukung. Gunakan JPG, PNG, atau WEBP.`
            : `"${file.name}" has an unsupported format. Please upload JPG, PNG, or WEBP.`
        );
        return false;
      }

      if (!ACCEPTED_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
        setErrorMessage(
          language === "id"
            ? `Tipe file "${file.name}" tidak valid.`
            : `"${file.name}" has an invalid MIME type.`
        );
        return false;
      }

      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage(
          language === "id"
            ? `Ukuran "${file.name}" melebihi batas 10MB.`
            : `"${file.name}" exceeds the 10MB size limit.`
        );
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          newItems.push({
            id: `src-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            dataUrl,
            size: file.size,
            type: file.type,
            width: img.naturalWidth,
            height: img.naturalHeight,
            tag: "front",
          });
          if (newItems.length === validFiles.length) {
            onAddImages(newItems);
          }
        };
        img.src = dataUrl;
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

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // -------------------------------------------------------------
  // HERO VARIANT (Center Canvas for Initial Empty State)
  // -------------------------------------------------------------
  if (variant === "hero") {
    return (
      <div className={`w-full max-w-xl mx-auto flex flex-col items-center text-center ${className}`}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.svg"
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label={language === "id" ? "Area upload foto produk" : "Product photo upload area"}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              fileInputRef.current?.click();
            }
          }}
          className={`w-full aspect-[4/3] max-h-[360px] border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors select-none ${
            dragActive
              ? "border-zinc-400 bg-zinc-800/40"
              : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/40 hover:bg-zinc-900/60"
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 mb-4">
            <Upload className="w-7 h-7 text-zinc-300" />
          </div>

          <h2 className="text-base font-semibold text-zinc-100 max-w-md">
            {language === "id"
              ? "Unggah foto produk Anda untuk memulai foto studio komersial dengan AI"
              : "Upload your product photo to begin AI studio photography"}
          </h2>

          <p className="text-xs text-zinc-400 mt-2 max-w-sm">
            {language === "id"
              ? "Tarik dan lepaskan file ke sini, atau klik untuk memilih file dari perangkat Anda."
              : "Drag and drop files here, or click to browse from your device."}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 btn-primary px-5 py-2.5 text-xs font-semibold rounded-lg shadow-sm">
            <Upload className="w-4 h-4" />
            <span>{language === "id" ? "Pilih Foto Produk" : "Select Product Photo"}</span>
          </div>

          <span className="text-[11px] text-zinc-400 mt-4">
            {language === "id"
              ? "Mendukung JPG, PNG, atau WEBP hingga 10MB"
              : "Supports JPG, PNG, or WEBP up to 10MB"}
          </span>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-red-950/50 border border-red-800 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // COMPACT VARIANT (Sidebar)
  // -------------------------------------------------------------
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-300 block">
          {language === "id" ? "Foto Produk Asli" : "Raw Product Photo"}
        </label>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
          {images.length} {language === "id" ? "foto" : "photos"}
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.svg"
        className="hidden"
        onChange={(e) => e.target.files && processFiles(e.target.files)}
      />

      {/* Upload Dropzone (Compact) */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={language === "id" ? "Unggah foto produk" : "Upload product photo"}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            fileInputRef.current?.click();
          }
        }}
        className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
          dragActive
            ? "border-zinc-400 bg-zinc-800/40"
            : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/50 hover:bg-zinc-900"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <Upload className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-300">
            {images.length === 0
              ? language === "id" ? "Pilih atau seret foto produk" : "Select or drag product photo"
              : language === "id" ? "Tambah / ganti foto produk" : "Add / replace photo"}
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800/80 flex items-center gap-2 text-xs text-red-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loaded Images List (Compact Thumbnail Cards) */}
      {images.length > 0 && (
        <div className="space-y-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="card-flat-subtle p-2 rounded-lg flex items-center gap-2.5 justify-between"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-12 h-12 rounded bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="w-full h-full object-contain p-0.5"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-200 truncate" title={img.name}>
                    {img.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    {formatSize(img.size)} {img.width && img.height ? `• ${img.width}×${img.height}` : ""}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewImage(img)}
                  aria-label={`Pratinjau foto ${img.name}`}
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Pratinjau"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveImage(img.id)}
                  aria-label={`Hapus foto ${img.name}`}
                  className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Hapus"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="card-flat max-w-2xl w-full p-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">{previewImage.name}</h4>
                <p className="text-xs text-zinc-400">
                  {formatSize(previewImage.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                aria-label="Tutup pratinjau foto"
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 max-h-[70vh] flex items-center justify-center bg-zinc-950 rounded-lg p-2 border border-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.dataUrl}
                alt={previewImage.name}
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
