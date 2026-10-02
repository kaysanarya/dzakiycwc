"use client";

import React, { useRef, useState } from "react";
import { UploadedImage } from "@/types";
import { Upload, X, Tag, Eye, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ProductSourceUploadProps {
  images: UploadedImage[];
  onAddImages: (newImages: UploadedImage[]) => void;
  onRemoveImage: (id: string) => void;
  onUpdateTag: (id: string, tag: UploadedImage["tag"]) => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ProductSourceUpload({
  images,
  onAddImages,
  onRemoveImage,
  onUpdateTag,
}: ProductSourceUploadProps) {
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);

  const processFiles = (files: FileList | File[]) => {
    setErrorMessage(null);
    const newItems: UploadedImage[] = [];

    const validFiles = Array.from(files).filter((file) => {
      // 1. Validate file extension
      const ext = file.name.split(".").pop()?.toLowerCase();
      const validExtensions = ["jpg", "jpeg", "png", "webp", "svg"];
      if (!ext || !validExtensions.includes(ext)) {
        setErrorMessage(`"${file.name}" has an unsupported format. Please upload JPG, PNG, or WEBP.`);
        return false;
      }

      // 2. Validate MIME type
      if (!ACCEPTED_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
        setErrorMessage(`"${file.name}" has an invalid MIME type.`);
        return false;
      }

      // 3. Validate size
      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage(`"${file.name}" exceeds the 10MB size limit.`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    validFiles.forEach((file) => {
      // Read file and validate image dimensions
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight uppercase flex items-center gap-2">
            <span>FOTO MENTAHAN (KATEGORI FISIK)</span>
            <span className="text-[10px] font-extrabold tracking-wider text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              SOURCE OF TRUTH
            </span>
          </h3>
          <p className="text-xs text-white/50 mt-0.5 font-medium">
            {language === "id"
              ? "Unggah foto produk asli dari berbagai sudut. Identitas fisik ini akan dikunci dan dipertahankan."
              : "Upload authentic product photos from multiple angles. Physical identity will be locked and preserved."}
          </p>
        </div>
        <span className="text-xs font-semibold text-white/60 self-start sm:self-auto bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.07]">
          {images.length} {images.length === 1 ? (language === "id" ? "sudut terunggah" : "angle loaded") : (language === "id" ? "sudut terunggah" : "angles loaded")}
        </span>
      </div>

      {/* Upload Guidelines Banner (Requirement 3) */}
      <div className="p-3.5 rounded-2xl liquid-glass-subcard flex items-start gap-2.5 text-xs text-white/70">
        <div className="w-5 h-5 rounded-full bg-[#1951fc] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
          ℹ
        </div>
        <div className="leading-relaxed">
          <p className="font-bold text-white">
            {language === "id" ? "Panduan Unggah (Upload Guidelines):" : "Upload Guidelines:"}
          </p>
          <p className="text-white/50 text-[11px] mt-0.5 font-medium">
            {language === "id"
              ? "Gunakan pencahayaan merata, hindari bayangan keras, dan pastikan seluruh produk terlihat jelas untuk hasil Blueprint terbaik."
              : "Use even lighting, avoid harsh cast shadows, and ensure the entire product is clearly visible for the best Blueprint extraction."}
          </p>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 backdrop-blur-md ${
          dragActive
            ? "border-[#3781fc] bg-[#1951fc]/15"
            : "border-white/[0.07] hover:border-[#3781fc]/50 bg-white/[0.02] hover:bg-white/[0.03]"
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
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1951fc]/25 to-[#3781fc]/25 border border-white/[0.08] flex items-center justify-center text-[#3781fc]">
            <Upload className="w-5 h-5 text-[#3781fc]" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">
              {t.upload.clickToUpload}
            </p>
            <p className="text-[11px] text-white/50 mt-0.5 font-medium">
              {t.upload.uploadsSupport}
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loaded Images List */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative liquid-glass-subcard rounded-2xl p-2.5 flex flex-col justify-between hover:shadow-[0_8px_24px_rgba(3,25,91,0.25)] transition-all"
            >
              <div className="relative aspect-square w-full rounded-xl bg-white/[0.025] overflow-hidden flex items-center justify-center border border-white/[0.05]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="w-full h-full object-contain p-1"
                />

                {/* Hover overlay preview button */}
                <div className="absolute inset-0 bg-white/[0.05] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(img);
                    }}
                    className="p-2 rounded-full bg-[#cbe9fd]/20 backdrop-blur-md text-white hover:bg-[#cbe9fd]/30 transition-all cursor-pointer"
                    title="Zoom Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage(img.id);
                    }}
                    className="p-2 rounded-full bg-red-500/20 backdrop-blur-md text-red-300 hover:bg-red-500/30 transition-all cursor-pointer"
                    title="Remove Image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Metadata & Tag selector */}
              <div className="mt-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-white truncate max-w-[130px]" title={img.name}>
                    {img.name}
                  </span>
                  <span className="text-[#3781fc]/50 font-mono text-[10px] shrink-0">{formatSize(img.size)}</span>
                </div>

                {/* Perspective Tag Selector */}
                <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.05]">
                  <span className="text-[10px] font-bold text-white/50 uppercase flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" /> {t.upload.tagLabel}
                  </span>
                  <select
                    value={img.tag || "front"}
                    onChange={(e) => onUpdateTag(img.id, e.target.value as UploadedImage["tag"])}
                    className="text-[11px] font-semibold bg-white/[0.04] backdrop-blur-xs text-white border border-white/[0.07] rounded-lg px-2 py-0.5 focus:outline-none focus:border-[#3781fc] cursor-pointer"
                  >
                    <option value="front">{t.upload.frontView}</option>
                    <option value="side">{t.upload.sideProfile}</option>
                    <option value="back">{t.upload.backView}</option>
                    <option value="top">{t.upload.topFlatlay}</option>
                    <option value="bottom">{t.upload.bottomSole}</option>
                    <option value="outsole">{t.upload.outsoleProfile}</option>
                    <option value="logo">{t.upload.logoDetail}</option>
                    <option value="buckle">{t.upload.buckleHardware}</option>
                    <option value="strap">{t.upload.strapDetail}</option>
                    <option value="detail">{t.upload.materialTexture}</option>
                    <option value="general">{t.upload.general}</option>
                  </select>
                </div>

                {img.width && img.height && (
                  <p className="text-[10px] text-[#3781fc]/40">
                    {t.upload.dimensions} {img.width} × {img.height}px
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-[#020e2d]/90 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-2xl w-full liquid-glass-card rounded-2xl overflow-hidden p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h4 className="text-sm font-bold text-white">{previewImage.name}</h4>
                <p className="text-xs text-white/50">
                  {formatSize(previewImage.size)} • Tag: {previewImage.tag}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-md text-white/60 hover:text-white hover:bg-[#1951fc]/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 max-h-[70vh] flex items-center justify-center bg-white/[0.03] rounded-xl p-2">
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
