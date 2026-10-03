"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, Eye, EyeOff, Save, Trash2, CheckCircle2, ExternalLink } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export type AIProviderType = "openai" | "stability" | "replicate" | "gemini";

export interface ApiCredentials {
  provider: AIProviderType;
  apiKey: string;
}

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCredentials: (credentials: ApiCredentials | null, rememberOnDevice?: boolean) => void;
  currentCredentials: ApiCredentials | null;
}

const PROVIDERS_INFO: Record<
  AIProviderType,
  { name: string; model: string; getKeyUrl: string; desc: string; placeholder: string }
> = {
  openai: {
    name: "OpenAI (DALL-E 3)",
    model: "dall-e-3 (1024x1024 / 1024x1792)",
    getKeyUrl: "https://platform.openai.com/api-keys",
    desc: "Menghasilkan foto komersial fotorealistik berkualitas tinggi dengan kepatuhan prompt visual yang sangat detail.",
    placeholder: "sk-proj-...",
  },
  stability: {
    name: "Stability AI (Stable Diffusion 3 / Core)",
    model: "stable-image-core / sd3-large",
    getKeyUrl: "https://platform.stability.ai/account/keys",
    desc: "Sangat unggul dalam pencahayaan studio komersial, tekstur material kulit/kain, dan rendering latar belakang.",
    placeholder: "sk-...",
  },
  replicate: {
    name: "Replicate (Flux / SDXL)",
    model: "black-forest-labs/flux-schnell & flux-dev",
    getKeyUrl: "https://replicate.com/account/api-tokens",
    desc: "Model generasi terkini dengan fidelity tipografi dan struktur geometri produk yang sangat tajam.",
    placeholder: "r8_...",
  },
  gemini: {
    name: "Google AI Studio (Gemini Vision)",
    model: "gemini-2.0-flash",
    getKeyUrl: "https://aistudio.google.com/app/apikey",
    desc: "Gratis untuk analisis Vision & Blueprint produk. Untuk generate gambar visual AI baru via Imagen 3, Google mewajibkan GCP Billing aktif. Direkomendasikan OpenAI DALL-E 3 atau Stability AI untuk generate visual instan.",
    placeholder: "AIzaSy...",
  },
};

export function ApiSettingsModal({
  isOpen,
  onClose,
  onSaveCredentials,
  currentCredentials,
}: ApiSettingsModalProps) {
  const { language } = useLanguage();
  const [provider, setProvider] = useState<AIProviderType>("openai");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [rememberOnDevice, setRememberOnDevice] = useState(false);

  useEffect(() => {
    if (currentCredentials) {
      // Sinkronisasi state form modal ketika kredensial eksternal berubah atau modal dibuka
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProvider(currentCredentials.provider);
      setApiKey(currentCredentials.apiKey);
    } else {
      setApiKey("");
    }
    try {
      const isRemembered = localStorage.getItem("vellum_remember_credentials") === "true";
      setRememberOnDevice(isRemembered);
    } catch {
      // ignore
    }
  }, [currentCredentials, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      onSaveCredentials(null, false);
    } else {
      onSaveCredentials(
        {
          provider,
          apiKey: apiKey.trim(),
        },
        rememberOnDevice
      );
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    setApiKey("");
    onSaveCredentials(null, false);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const activeProvider = PROVIDERS_INFO[provider];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="card-flat max-w-xl w-full p-5 sm:p-6 space-y-4 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                {language === "id" ? "Pengaturan API Key AI" : "AI API Settings"}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {language === "id"
                  ? "Hubungkan model visual AI sungguhan untuk men-generate foto produk nyata."
                  : "Connect real AI image generation providers to produce authentic product photos."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan API key"
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Current status banner */}
        {currentCredentials?.apiKey ? (
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2.5 text-xs text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="font-medium leading-relaxed">
              {language === "id"
                ? `Terhubung ke ${PROVIDERS_INFO[currentCredentials.provider].name}. Siap generate foto komersial nyata!`
                : `Connected to ${PROVIDERS_INFO[currentCredentials.provider].name}. Ready for real image generation!`}
            </span>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-2.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-white shrink-0 mt-1 shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
            <div>
              <p className="font-semibold text-zinc-200">
                {language === "id" ? "Mode Demo Aktif" : "Demo Mode Active"}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 font-normal leading-relaxed">
                {language === "id"
                  ? "Tanpa API Key, studio berjalan dalam mode simulasi cerdas (foto demo resolusi tinggi). Masukkan API Key di bawah ini untuk menghasilkan foto unik dari produk Anda sendiri."
                  : "Without an API key, the studio runs in smart demo mode with high-resolution pre-rendered studio shots. Enter your API key below to generate unique live photos."}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Provider Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
              {language === "id" ? "Pilih Provider AI Visual:" : "Select AI Visual Provider:"}
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AIProviderType)}
              className="w-full text-xs font-semibold text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 cursor-pointer shadow-sm transition-colors"
            >
              <option value="openai" className="bg-zinc-900 text-zinc-100 py-1">OpenAI — DALL-E 3 (Direkomendasikan)</option>
              <option value="stability" className="bg-zinc-900 text-zinc-100 py-1">Stability AI — Stable Diffusion 3 / Core</option>
              <option value="replicate" className="bg-zinc-900 text-zinc-100 py-1">Replicate — Flux Schnell / SDXL</option>
              <option value="gemini" className="bg-zinc-900 text-zinc-100 py-1">Google AI Studio — Imagen 3 / Gemini</option>
            </select>
            <p className="text-[11px] text-zinc-400 mt-1.5 font-normal leading-relaxed">
              {activeProvider.desc}
            </p>
          </div>

          {/* API Key Input */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label className="font-semibold text-zinc-200">
                API Key {activeProvider.name}:
              </label>
              <a
                href={activeProvider.getKeyUrl}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-white hover:underline font-medium inline-flex items-center gap-1 text-[11px] transition-colors"
              >
                <span>Dapatkan API Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={activeProvider.placeholder}
                className="w-full text-xs font-mono font-medium text-zinc-100 placeholder:text-zinc-600 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 pr-10 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 shadow-sm transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer transition-colors p-1"
                title={showKey ? "Sembunyikan" : "Tampilkan"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Remember on Device Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={rememberOnDevice}
                  onChange={(e) => setRememberOnDevice(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-0 cursor-pointer accent-zinc-200"
                />
                <div>
                  <span className="font-semibold text-zinc-200">
                    {language === "id" ? "Ingat di perangkat ini" : "Remember on this device"}
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                    {language === "id"
                      ? "Secara default, key hanya disimpan untuk sesi browser ini (sessionStorage). Centang untuk menyimpan permanen di browser ini (localStorage)."
                      : "By default, key is stored only for this browser session (sessionStorage). Check to store permanently on this device (localStorage)."}
                    <span className="text-zinc-300 block mt-0.5 font-medium">
                      ⚠️ {language === "id" ? "Peringatan: Jangan centang bila menggunakan komputer publik atau bersama." : "Warning: Do not check on public or shared computers."}
                    </span>
                  </p>
                </div>
              </label>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 font-mono">
              *Key dikirim hanya via header (x-api-key) dan tidak pernah disimpan di server.
            </p>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 border border-zinc-800 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Gunakan Demo Mode (Hapus Key)</span>
            </button>

            <button
              type="submit"
              className="btn-primary h-9 px-5 text-xs font-semibold gap-1.5"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Kredensial</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
