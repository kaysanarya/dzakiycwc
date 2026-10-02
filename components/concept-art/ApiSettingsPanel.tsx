"use client";
import React, { useState } from "react";
import { Key, Eye, EyeOff, CheckCircle2, ExternalLink, X } from "lucide-react";

export type ImageProvider = "pollinations" | "openai" | "gemini";

export interface ProviderConfig {
  id: ImageProvider;
  name: string;
  shortName: string;
  model: string;
  icon: string;
  color: string;
  gradient: string;
  docsUrl: string;
  keyName: string;
  keyPlaceholder: string;
  free: boolean;
  quality: string;
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: "pollinations",
    name: "Pollinations.ai",
    shortName: "Pollinations",
    model: "Flux Realism",
    icon: "🌸",
    color: "#10b981",
    gradient: "linear-gradient(135deg, #059669, #10b981)",
    docsUrl: "https://pollinations.ai",
    keyName: "",
    keyPlaceholder: "",
    free: true,
    quality: "Good",
  },
  {
    id: "openai",
    name: "OpenAI",
    shortName: "OpenAI",
    model: "DALL-E 3 HD",
    icon: "⚡",
    color: "#0ea5e9",
    gradient: "linear-gradient(135deg, #0284c7, #0ea5e9)",
    docsUrl: "https://platform.openai.com/api-keys",
    keyName: "OPENAI_API_KEY",
    keyPlaceholder: "sk-proj-...",
    free: false,
    quality: "Excellent",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    shortName: "Gemini",
    model: "Imagen 3",
    icon: "✨",
    color: "#8b5cf6",
    gradient: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
    docsUrl: "https://aistudio.google.com/app/apikey",
    keyName: "GEMINI_API_KEY",
    keyPlaceholder: "AIzaSy...",
    free: false,
    quality: "Excellent",
  },
];

interface ApiSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProvider: ImageProvider;
  onProviderChange: (p: ImageProvider) => void;
  apiKeys: Record<string, string>;
  onApiKeyChange: (provider: ImageProvider, key: string) => void;
}

export function ApiSettingsPanel({
  isOpen, onClose, selectedProvider, onProviderChange, apiKeys, onApiKeyChange,
}: ApiSettingsPanelProps) {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-lg rounded-[28px] overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            border: "1px solid rgba(255,255,255,0.9)",
            boxShadow: "0 40px 80px -20px rgba(15,60,130,0.25), inset 0 2px 2px rgba(255,255,255,0.95)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.6)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 12px rgba(99,102,241,0.4)" }}>
                <Key className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Pilih AI Image Provider</h3>
                <p className="text-[10px] text-white/60">Pilih provider &amp; masukkan API key kamu</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.85)" }}>
              <X className="w-3.5 h-3.5 text-white/80" />
            </button>
          </div>

          {/* Provider Cards */}
          <div className="p-5 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
            {PROVIDERS.map((p) => {
              const isSelected = selectedProvider === p.id;
              return (
                <div key={p.id} className="rounded-2xl overflow-hidden transition-all"
                  style={{
                    border: isSelected ? `2px solid ${p.color}` : "1.5px solid rgba(255,255,255,0.75)",
                    boxShadow: isSelected ? `0 6px 20px rgba(0,0,0,0.08), 0 0 0 3px ${p.color}22` : "0 2px 8px rgba(15,60,130,0.06)",
                  }}>

                  {/* Provider select row */}
                  <button id={`provider-${p.id}`} onClick={() => onProviderChange(p.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all"
                    style={{ background: isSelected ? `${p.color}0f` : "rgba(255,255,255,0.6)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: p.gradient, boxShadow: `0 4px 12px ${p.color}40` }}>
                      {p.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{p.name}</span>
                        {p.free && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "#dcfce7", color: "#16a34a" }}>
                            GRATIS
                          </span>
                        )}
                        {!p.free && !!apiKeys[p.id] && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "#dbeafe", color: "#2563eb" }}>
                            KEY TERSIMPAN
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-white/60">{p.model}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: `${p.color}15`, color: p.color }}>{p.quality}</span>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: p.color }} />}
                  </button>

                  {/* API Key input (only when selected & needs key) */}
                  {isSelected && !p.free && (
                    <div className="px-4 pb-4" style={{ borderTop: `1px solid ${p.color}20` }}>
                      <div className="pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                            {p.keyName}
                          </label>
                          <a href={p.docsUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] font-semibold hover:underline"
                            style={{ color: p.color }}>
                            <ExternalLink className="w-3 h-3" />
                            Dapatkan API Key gratis
                          </a>
                        </div>
                        <div className="relative">
                          <input
                            id={`apikey-${p.id}`}
                            type={showKeys[p.id] ? "text" : "password"}
                            value={apiKeys[p.id] ?? ""}
                            onChange={(e) => onApiKeyChange(p.id, e.target.value)}
                            placeholder={p.keyPlaceholder}
                            className="w-full pr-10 pl-3.5 py-2.5 text-sm font-mono liquid-glass-input"
                            style={{ borderRadius: "12px" }}
                          />
                          <button type="button"
                            onClick={() => setShowKeys((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3781fc]/70 hover:text-white/80 cursor-pointer">
                            {showKeys[p.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-[#3781fc]/70 mt-1.5 leading-snug">
                          🔒 API key disimpan di localStorage browser kamu — tidak dikirim ke mana pun kecuali saat generate gambar.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
