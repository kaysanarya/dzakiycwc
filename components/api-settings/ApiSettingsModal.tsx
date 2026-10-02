"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, Eye, EyeOff, Save, Trash2, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
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
      className="fixed inset-0 z-50 bg-[#00030a]/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="liquid-glass-card max-w-xl w-full bg-[#0c101d]/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.85),0_0_0_1px_rgba(55,129,252,0.2)] border border-white/[0.12] space-y-5 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1951fc]/15 border border-[#3781fc]/30 flex items-center justify-center text-[#3781fc] shadow-2xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {language === "id" ? "Pengaturan API Key AI" : "AI API Settings"}
              </h3>
              <p className="text-xs text-white/70 font-medium mt-0.5">
                {language === "id"
                  ? "Hubungkan model visual AI sungguhan untuk men-generate foto produk nyata."
                  : "Connect real AI image generation providers to produce authentic product photos."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/[0.08] cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Current status banner */}
        {currentCredentials?.apiKey ? (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium leading-relaxed">
              {language === "id"
                ? `Terhubung ke ${PROVIDERS_INFO[currentCredentials.provider].name}. Siap generate foto komersial nyata!`
                : `Connected to ${PROVIDERS_INFO[currentCredentials.provider].name}. Ready for real image generation!`}
            </span>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">
                {language === "id" ? "Mode Demo Aktif" : "Demo Mode Active"}
              </p>
              <p className="text-[11px] text-amber-200/90 mt-0.5 font-medium leading-relaxed">
                {language === "id"
                  ? "Tanpa API Key, studio berjalan dalam mode simulasi cerdas (foto demo resolusi tinggi). Masukkan API Key di bawah ini untuk menghasilkan foto unik dari produk Anda sendiri."
                  : "Without an API key, the studio runs in smart demo mode with high-resolution pre-rendered studio shots. Enter your API key below to generate unique live photos."}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Provider Selector (Requirement 2: Dropdown OpenAI DALL-E 3, Stability AI, Replicate) */}
          <div>
            <label className="block text-xs font-bold text-white mb-1.5">
              {language === "id" ? "Pilih Provider AI Visual:" : "Select AI Visual Provider:"}
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AIProviderType)}
              className="w-full text-xs font-semibold text-white bg-[#131726] border border-white/[0.12] rounded-xl px-3.5 py-2.5 focus:border-[#3781fc] focus:outline-none focus:ring-1 focus:ring-[#3781fc] cursor-pointer shadow-inner transition-colors"
            >
              <option value="openai" className="bg-[#131726] text-white py-1">OpenAI — DALL-E 3 (Direkomendasikan)</option>
              <option value="stability" className="bg-[#131726] text-white py-1">Stability AI — Stable Diffusion 3 / Core</option>
              <option value="replicate" className="bg-[#131726] text-white py-1">Replicate — Flux Schnell / SDXL</option>
              <option value="gemini" className="bg-[#131726] text-white py-1">Google AI Studio — Imagen 3 / Gemini</option>
            </select>
            <p className="text-[11px] text-white/70 mt-1.5 font-medium leading-relaxed">
              {activeProvider.desc}
            </p>
          </div>

          {/* API Key Input (Requirement 2: Tipe password disamarkan) */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label className="font-bold text-white">
                API Key {activeProvider.name}:
              </label>
              <a
                href={activeProvider.getKeyUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#3781fc] hover:text-[#cbe9fd] hover:underline font-semibold inline-flex items-center gap-1 text-[11px] transition-colors"
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
                className="w-full text-xs font-mono font-medium text-white placeholder:text-white/35 bg-[#131726] border border-white/[0.12] rounded-xl px-3.5 py-2.5 pr-10 focus:border-[#3781fc] focus:outline-none focus:ring-1 focus:ring-[#3781fc] shadow-inner transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white cursor-pointer transition-colors p-1"
                title={showKey ? "Sembunyikan" : "Tampilkan"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Remember on Device Checkbox (Rule 7) */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={rememberOnDevice}
                  onChange={(e) => setRememberOnDevice(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-[#131726] text-[#1951fc] focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="font-semibold text-white">
                    {language === "id" ? "Ingat di perangkat ini" : "Remember on this device"}
                  </span>
                  <p className="text-[11px] text-white/60 mt-0.5 leading-snug">
                    {language === "id"
                      ? "Secara default, key hanya disimpan untuk sesi browser ini (sessionStorage). Centang untuk menyimpan permanen di browser ini (localStorage)."
                      : "By default, key is stored only for this browser session (sessionStorage). Check to store permanently on this device (localStorage)."}
                    <span className="text-amber-400 block mt-0.5 font-medium">
                      ⚠️ {language === "id" ? "Peringatan: Jangan centang bila menggunakan komputer publik atau bersama." : "Warning: Do not check on public or shared computers."}
                    </span>
                  </p>
                </div>
              </label>
            </div>
            <p className="text-[10px] text-white/50 mt-1 font-medium italic">
              *Key dikirim hanya via header (x-api-key) dan tidak pernah disimpan di server.
            </p>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-red-400 hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Gunakan Demo Mode (Hapus Key)</span>
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#1951fc] hover:bg-[#1447db] text-white text-xs font-bold transition-all shadow-[0_2px_12px_rgba(25,81,252,0.4)] hover:shadow-[0_4px_16px_rgba(25,81,252,0.5)] flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
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
