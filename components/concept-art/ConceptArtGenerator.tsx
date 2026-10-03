"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Sparkles, X, Download, RefreshCw, ImagePlus, Wand2,
  Film, LayoutGrid, Maximize2, Settings2, Loader2, AlertCircle,
  CheckCircle2, ChevronRight,
} from "lucide-react";
import { ApiSettingsPanel, PROVIDERS, type ImageProvider } from "./ApiSettingsPanel";

// ── Types ─────────────────────────────────────────────────────────────────────
type AspectRatio = "poster" | "landscape" | "square" | "wide";
type ArtStyle =
  | "cinematic" | "noire" | "cyberpunk" | "anime"
  | "concept-art" | "retro-poster" | "documentary" | "expressionist";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: ArtStyle;
  aspectRatio: AspectRatio;
  seed: number;
  dimensions: string;
  provider: string;
  createdAt: Date;
}

// ── Style & Ratio Options ─────────────────────────────────────────────────────
const STYLE_OPTIONS: { value: ArtStyle; emoji: string; label: string; labelId: string }[] = [
  { value: "cinematic",     emoji: "\u{1F3AC}", label: "Cinematic",     labelId: "Sinematik"   },
  { value: "noire",         emoji: "\u{1F575}\uFE0F", label: "Film Noir",  labelId: "Film Noir"   },
  { value: "cyberpunk",     emoji: "\u26A1",   label: "Cyberpunk",     labelId: "Cyberpunk"   },
  { value: "anime",         emoji: "\u2728",   label: "Anime",          labelId: "Anime"       },
  { value: "concept-art",   emoji: "\u{1F58C}\uFE0F", label: "Concept Art", labelId: "Seni Konsep" },
  { value: "retro-poster",  emoji: "\u{1F4FD}\uFE0F", label: "Retro Poster", labelId: "Poster Retro" },
  { value: "documentary",   emoji: "\u{1F4F7}", label: "Documentary", labelId: "Dokumenter"  },
  { value: "expressionist", emoji: "\u{1F300}", label: "Expressionist", labelId: "Ekspresionis" },
];

const RATIO_OPTIONS: { value: AspectRatio; label: string; dims: string }[] = [
  { value: "poster",    label: "Poster",    dims: "768\xD71152" },
  { value: "landscape", label: "Landscape", dims: "1280\xD7720" },
  { value: "square",    label: "Square",    dims: "1024\xD71024" },
  { value: "wide",      label: "Wide",      dims: "1344\xD7768"  },
];

const EXAMPLE_PROMPTS = [
  "A lone detective stands in a rain-soaked alley at midnight, neon signs reflecting on the wet pavement",
  "Epic space opera battle above a dying planet, silhouette of a lone hero against the stars",
  "A samurai meditates at the edge of a cliff at sunset, cherry blossoms falling around him",
  "Underground jazz club in 1950s New York, smoke-filled room, spotlight on a saxophonist",
  "Post-apocalyptic Tokyo, overgrown skyscrapers, a child playing among ruins at golden hour",
];

const STORAGE_KEY = "vellum_concept_art_settings";

// ── Component ─────────────────────────────────────────────────────────────────
interface ConceptArtGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConceptArtGenerator({ isOpen, onClose }: ConceptArtGeneratorProps) {
  const { t, language } = useLanguage();
  const ca = t.conceptArt;

  const [prompt, setPrompt]               = useState("");
  const [filmReference, setFilmReference] = useState("");
  const [style, setStyle]                 = useState<ArtStyle>("cinematic");
  const [aspectRatio, setAspectRatio]     = useState<AspectRatio>("poster");
  const [provider, setProvider]           = useState<ImageProvider>(() => {
    if (typeof window === "undefined") return "pollinations";
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { provider: p } = JSON.parse(saved) as { provider?: ImageProvider };
        if (p) return p;
      }
    } catch { /* ignore */ }
    return "pollinations";
  });
  const [apiKeys, setApiKeys]             = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { apiKeys: k } = JSON.parse(saved) as { apiKeys?: Record<string, string> };
        if (k) return k;
      }
    } catch { /* ignore */ }
    return {};
  });
  const [showSettings, setShowSettings]   = useState(false);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [gallery, setGallery]             = useState<GeneratedImage[]>([]);
  const [lightbox, setLightbox]           = useState<GeneratedImage | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Keep track of all created object URLs to prevent memory leaks (F-07)
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Revoke all object URLs and abort in-flight requests when modal is closed
  useEffect(() => {
    if (!isOpen) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      objectUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch { /* ignore */ }
      });
      objectUrlsRef.current.clear();
    }
  }, [isOpen]);

  // Revoke all object URLs and abort pending requests when component unmounts
  useEffect(() => {
    const activeUrls = objectUrlsRef.current;
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      activeUrls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch { /* ignore */ }
      });
      activeUrls.clear();
    };
  }, []);

  const saveSettings = (p: ImageProvider, keys: Record<string, string>) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ provider: p, apiKeys: keys }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ provider: p, apiKeys: keys }));
    } catch { /* ignore */ }
  };

  const handleProviderChange = (p: ImageProvider) => {
    setProvider(p);
    saveSettings(p, apiKeys);
  };

  const handleApiKeyChange = (p: ImageProvider, key: string) => {
    const next = { ...apiKeys, [p]: key };
    setApiKeys(next);
    saveSettings(provider, next);
  };

  const currentProvider = PROVIDERS.find((p) => p.id === provider) ?? PROVIDERS[0];
  const needsKey = !currentProvider.free;
  const hasKey   = !needsKey || !!apiKeys[provider]?.trim();

  const doGenerate = useCallback(async (
    genPrompt: string, genStyle: ArtStyle, genRatio: AspectRatio, genMovieRef?: string
  ) => {
    // Abort any existing in-flight generation
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsGenerating(true);
    setError(null);
    try {
      const userKey = apiKeys[provider]?.trim();
      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(userKey ? { "x-api-key": userKey } : {}),
      };

      const res = await fetch("/api/concept-art", {
        method: "POST",
        headers: authHeaders,
        signal: controller.signal,
        body: JSON.stringify({
          prompt: genPrompt,
          style: genStyle,
          aspectRatio: genRatio,
          movieRef: genMovieRef || undefined,
          provider,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      const seed       = parseInt(res.headers.get("X-Seed") ?? "0", 10);
      const dimensions = res.headers.get("X-Dimensions") ?? "";
      const prov       = res.headers.get("X-Provider") ?? provider;
      const blob       = await res.blob();

      // Guard: if aborted while downloading blob or if component state changed
      if (controller.signal.aborted) {
        return;
      }

      const url        = URL.createObjectURL(blob);
      objectUrlsRef.current.add(url);

      const newImg: GeneratedImage = {
        id: crypto.randomUUID(),
        url, prompt: genPrompt, style: genStyle, aspectRatio: genRatio,
        seed, dimensions, provider: prov, createdAt: new Date(),
      };
      setGallery((prev) => [newImg, ...prev]);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return; // Silent handling of user cancellation or modal closure
      }
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsGenerating(false);
    }
  }, [provider, apiKeys]);

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating || !hasKey) return;
    doGenerate(prompt.trim(), style, aspectRatio, filmReference || undefined);
  };

  const handleRegenerate = useCallback((img: GeneratedImage) => {
    if (isGenerating) return;
    doGenerate(img.prompt, img.style, img.aspectRatio);
  }, [isGenerating, doGenerate]);

  const handleDownload = (img: GeneratedImage) => {
    const a = document.createElement("a");
    a.href = img.url;
    a.download = `vellum-art-${img.seed}.jpg`;
    a.click();
  };

  const handleRemove = (id: string) => {
    const img = gallery.find((i) => i.id === id);
    if (img) {
      try {
        URL.revokeObjectURL(img.url);
      } catch { /* ignore */ }
      objectUrlsRef.current.delete(img.url);
    }
    setGallery((prev) => prev.filter((i) => i.id !== id));
    if (lightbox?.id === id) setLightbox(null);
  };

  if (!isOpen) return null;

  const getAR = (ar: AspectRatio) =>
    ar === "poster" ? "2/3" : ar === "landscape" ? "16/9" : ar === "wide" ? "7/4" : "1/1";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Shell */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-5xl flex flex-col rounded-[32px] overflow-hidden"
          style={{
            maxHeight: "92vh",
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            border: "1px solid rgba(255,255,255,0.85)",
            boxShadow: "0 40px 80px -20px rgba(15,60,130,0.22), inset 0 2px 2px rgba(255,255,255,0.95)",
          }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-7 py-4 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.55)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#7c3aed,#6366f1)", boxShadow: "0 6px 18px rgba(99,102,241,0.4)" }}>
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{ca.title}</h2>
                <p className="text-[10px] text-white/60">{ca.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button id="concept-art-settings-btn" onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl cursor-pointer transition-all"
                style={{
                  background: `${currentProvider.color}12`,
                  border: `1.5px solid ${currentProvider.color}35`,
                }}>
                <span className="text-base leading-none">{currentProvider.icon}</span>
                <span className="text-xs font-bold" style={{ color: currentProvider.color }}>{currentProvider.shortName}</span>
                {hasKey
                  ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: currentProvider.color }} />
                  : <Settings2 className="w-3.5 h-3.5 text-amber-500" />
                }
              </button>
              <button onClick={onClose} id="concept-art-close-btn"
                className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
                style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.85)" }}>
                <X className="w-4 h-4 text-white/80" />
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex flex-col lg:flex-row overflow-hidden flex-1 min-h-0">

            {/* LEFT: Controls */}
            <div className="lg:w-[400px] shrink-0 flex flex-col gap-4 p-5 overflow-y-auto"
              style={{ borderRight: "1px solid rgba(255,255,255,0.55)" }}>

              {/* API Key Warning */}
              {needsKey && !hasKey && (
                <button onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2.5 p-3.5 rounded-2xl w-full text-left cursor-pointer"
                  style={{ background: "rgba(245,158,11,0.08)", border: "1.5px solid rgba(245,158,11,0.3)" }}>
                  <Settings2 className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-amber-700">API Key Diperlukan</p>
                    <p className="text-[10px] text-amber-600">Klik untuk masukkan {currentProvider.name} API key</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </button>
              )}

              {/* Prompt Textarea */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{ca.promptLabel}</label>
                <div className="relative">
                  <textarea ref={promptRef} id="concept-art-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={ca.promptPlaceholder}
                    maxLength={600} rows={4}
                    className="w-full resize-none text-sm text-zinc-100 placeholder-zinc-500 p-3.5 pr-12 input-flat rounded-xl"
                  />
                  <span className="absolute bottom-3 right-3 text-[9px] font-mono text-zinc-500">{prompt.length}/600</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLE_PROMPTS.slice(0, 3).map((ex, i) => (
                    <button key={i} onClick={() => { setPrompt(ex); promptRef.current?.focus(); }}
                      className="text-[10px] px-2.5 py-1 rounded-full cursor-pointer font-semibold bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700">
                      {ca.example} {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Film Reference */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{ca.movieRefLabel}</label>
                <div className="relative">
                  <Film className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input id="concept-art-movie-ref" value={filmReference}
                    onChange={(e) => setFilmReference(e.target.value)}
                    placeholder={ca.movieRefPlaceholder}
                    className="w-full pl-9 pr-4 py-2 text-sm input-flat rounded-lg" />
                </div>
                <p className="text-[10px] text-[#3781fc]/70 leading-snug">{ca.movieRefHint}</p>
              </div>

              {/* Art Style Grid */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{ca.styleLabel}</label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLE_OPTIONS.map((s) => (
                    <button key={s.value} id={`style-${s.value}`} onClick={() => setStyle(s.value)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-2xl text-left cursor-pointer transition-all"
                      style={style === s.value ? {
                        background: "linear-gradient(135deg,#7c3aed,#6366f1)",
                        color: "#fff", border: "1px solid rgba(255,255,255,0.4)",
                        boxShadow: "0 6px 18px rgba(99,102,241,0.35)",
                      } : {
                        background: "rgba(255,255,255,0.55)",
                        border: "1px solid rgba(255,255,255,0.75)", color: "#334155",
                      }}>
                      <span className="text-base leading-none">{s.emoji}</span>
                      <span className="text-xs font-semibold">{language === "id" ? s.labelId : s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{ca.ratioLabel}</label>
                <div className="grid grid-cols-4 gap-2">
                  {RATIO_OPTIONS.map((r) => (
                    <button key={r.value} id={`ratio-${r.value}`} onClick={() => setAspectRatio(r.value)}
                      className="flex flex-col items-center gap-0.5 py-2.5 rounded-2xl cursor-pointer transition-all"
                      style={aspectRatio === r.value ? {
                        background: "linear-gradient(135deg,#0284c7,#2563eb)",
                        color: "#fff", border: "1px solid rgba(255,255,255,0.4)",
                        boxShadow: "0 6px 18px rgba(37,99,235,0.35)",
                      } : {
                        background: "rgba(255,255,255,0.55)",
                        border: "1px solid rgba(255,255,255,0.75)", color: "#334155",
                      }}>
                      <span className="text-xs font-bold">{r.label}</span>
                      <span className="text-[9px] opacity-70">{r.dims}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-red-600">Gagal generate gambar</p>
                    <p className="text-[11px] text-red-500 mt-0.5 leading-snug">{error}</p>
                    {(error.toLowerCase().includes("api key") || error.toLowerCase().includes("key")) && (
                      <button onClick={() => setShowSettings(true)}
                        className="mt-2 text-[11px] font-bold text-indigo-600 underline cursor-pointer">
                        Buka pengaturan API &rarr;
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button id="concept-art-generate-btn" onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating || (needsKey && !hasKey)}
                className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg,#7c3aed 0%,#6366f1 50%,#0ea5e9 100%)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.35)",
                  boxShadow: "0 12px 30px -4px rgba(99,102,241,0.5), inset 0 1.5px 2px rgba(255,255,255,0.5)",
                }}>
                {isGenerating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /><span>{ca.generating}</span></>
                  : <><Sparkles className="w-4 h-4" /><span>{ca.generateBtn}</span></>
                }
              </button>

              <p className="text-[10px] text-center text-[#3781fc]/70">
                {currentProvider.icon} {currentProvider.name} &bull; {currentProvider.model}
                {currentProvider.free ? " — Gratis, tanpa API key" : ""}
              </p>
            </div>

            {/* RIGHT: Gallery */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-3.5 shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.35)" }}>
                <LayoutGrid className="w-4 h-4 text-white/60" />
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{ca.galleryTitle}</span>
                {gallery.length > 0 && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>
                    {gallery.length}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {gallery.length === 0 && !isGenerating && (
                  <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                      style={{ background: "rgba(99,102,241,0.07)", border: "1.5px dashed rgba(99,102,241,0.3)" }}>
                      <ImagePlus className="w-9 h-9 text-indigo-400/60" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/60">{ca.emptyTitle}</p>
                      <p className="text-xs text-[#3781fc]/70 mt-1 max-w-xs leading-relaxed">{ca.emptyDesc}</p>
                    </div>
                    {/* Quick start tip */}
                    <div className="mt-2 p-3 rounded-2xl text-left max-w-xs"
                      style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}>
                      <p className="text-[10px] font-bold text-indigo-600 mb-1">💡 Tips Mulai Cepat</p>
                      <p className="text-[10px] text-white/60 leading-snug">
                        Pollinations.ai <strong>tidak perlu API key</strong> dan langsung bisa dipakai gratis.
                        Untuk kualitas lebih tinggi, tambahkan API key Gemini atau OpenAI.
                      </p>
                    </div>
                  </div>
                )}

                {isGenerating && gallery.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center gap-4">
                    <div className="relative w-20 h-20">
                      <div className="absolute inset-0 rounded-3xl animate-pulse"
                        style={{ background: "rgba(99,102,241,0.15)" }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Wand2 className="w-9 h-9 text-indigo-500" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white/80">{ca.renderingTitle}</p>
                      <p className="text-xs text-[#3781fc]/70 mt-1">{ca.renderingDesc}</p>
                    </div>
                  </div>
                )}

                {gallery.length > 0 && (
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                    {isGenerating && (
                      <div className="rounded-2xl overflow-hidden flex items-center justify-center"
                        style={{
                          background: "rgba(99,102,241,0.08)",
                          border: "1.5px dashed rgba(99,102,241,0.3)",
                          aspectRatio: getAR(aspectRatio),
                        }}>
                        <div className="flex flex-col items-center gap-2 p-4">
                          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                          <span className="text-xs font-medium text-indigo-500">{ca.generating}</span>
                        </div>
                      </div>
                    )}
                    {gallery.map((img) => {
                      const prov = PROVIDERS.find((p) => p.id === img.provider);
                      return (
                        <div key={img.id}
                          className="group relative rounded-2xl overflow-hidden cursor-pointer"
                          style={{
                            border: "1px solid rgba(255,255,255,0.75)",
                            boxShadow: "0 4px 16px rgba(15,60,130,0.1)",
                            aspectRatio: getAR(img.aspectRatio),
                          }}
                          onClick={() => setLightbox(img)}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt={img.prompt}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />

                          {prov && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold"
                              style={{ background: `${prov.color}ee`, color: "#fff", backdropFilter: "blur(8px)" }}>
                              {prov.icon} {prov.shortName}
                            </div>
                          )}

                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3"
                            style={{ background: "linear-gradient(to bottom,transparent 0%,rgba(0,0,0,0.65) 100%)" }}>
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRegenerate(img); }}
                                title={ca.regenerate}
                                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                                style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
                                <RefreshCw className="w-3.5 h-3.5 text-white" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDownload(img); }}
                                title={ca.download}
                                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                                style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
                                <Download className="w-3.5 h-3.5 text-white" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setLightbox(img); }}
                                title={ca.fullscreen}
                                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                                style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
                                <Maximize2 className="w-3.5 h-3.5 text-white" />
                              </button>
                            </div>
                            <p className="text-[11px] text-white/75 line-clamp-2 leading-snug">{img.prompt}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
          onClick={() => setLightbox(null)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.url} alt={lightbox.prompt}
              className="w-full rounded-3xl object-contain max-h-[80vh]"
              style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }} />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <span className="text-xs text-white/80 font-medium max-w-xs truncate">{lightbox.prompt}</span>
              <div className="w-px h-4 bg-white/25" />
              <span className="text-[10px] text-white/60 font-mono">{lightbox.dimensions}</span>
              <div className="w-px h-4 bg-white/25" />
              <button onClick={() => handleDownload(lightbox)}
                className="flex items-center gap-1.5 text-xs text-white font-semibold cursor-pointer hover:opacity-80">
                <Download className="w-3.5 h-3.5" />{ca.download}
              </button>
              <button onClick={() => handleRemove(lightbox.id)}
                className="flex items-center gap-1.5 text-xs text-red-300 font-semibold cursor-pointer hover:opacity-80">
                <X className="w-3.5 h-3.5" />{ca.remove}
              </button>
            </div>
            <button onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* API Settings Panel */}
      <ApiSettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        selectedProvider={provider}
        onProviderChange={handleProviderChange}
        apiKeys={apiKeys}
        onApiKeyChange={handleApiKeyChange}
      />
    </>
  );
}
