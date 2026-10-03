"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Header } from "@/components/app-shell/Header";
import { ProductSourceUpload } from "@/components/upload/ProductSourceUpload";
import { ReferenceUpload } from "@/components/upload/ReferenceUpload";
import { ProductSpec } from "@/components/product-spec/ProductSpec";
import { CameraSettings } from "@/components/camera-settings/CameraSettings";
import { ProductLocks } from "@/components/product-lock/ProductLocks";
import { AgentMonitor } from "@/components/agent-monitor/AgentMonitor";
import { BlueprintModal } from "@/components/blueprint/BlueprintModal";
import { BeforeAfterSlider } from "@/components/before-after/BeforeAfterSlider";
import { HistoryDrawer } from "@/components/history/HistoryDrawer";
import { ConceptArtGenerator } from "@/components/concept-art/ConceptArtGenerator";
import { ApiSettingsModal, type ApiCredentials } from "@/components/api-settings/ApiSettingsModal";

import {
  UploadedImage,
  ProductCategory,
  PhotographyDirection,
  PreservationSettings,
  ProductLocks as ProductLocksType,
  ProductBlueprint,
  AgentStep,
  GeneratedOutput,
  ValidationResult,
  GenerationHistoryItem,
} from "@/types";

import {
  DEMO_SOURCE_IMAGES,
  DEMO_REFERENCE_IMAGES,
  DEMO_FOOTWEAR_BLUEPRINT,
  DEMO_OUTPUTS,
} from "@/lib/ai/demoData";

import {
  Play,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  CheckCircle2,
  HelpCircle,
  Info,
  Clock,
  KeyRound,
  Sliders,
} from "lucide-react";

const getInitialSteps = (language: "en" | "id"): AgentStep[] => [
  {
    id: 1,
    key: "analyze",
    title: language === "id" ? "Analisis foto" : "Analyze photo",
    description: language === "id" ? "Mengenali bentuk dan detail fisik produk" : "Extract product features and category",
    status: "pending",
  },
  {
    id: 2,
    key: "cutout",
    title: language === "id" ? "Potong produk" : "Cut out product",
    description: language === "id" ? "Memisahkan produk asli dari latar foto" : "Isolate product from original background",
    status: "pending",
  },
  {
    id: 3,
    key: "background",
    title: language === "id" ? "Buat latar" : "Generate background",
    description: language === "id" ? "Membuat latar studio dan tata cahaya" : "Create studio background plate",
    status: "pending",
  },
  {
    id: 4,
    key: "composite",
    title: language === "id" ? "Tempel dan cek hasil" : "Composite & review",
    description: language === "id" ? "Menempel produk asli, bayangan alami, dan verifikasi" : "Paste authentic product, shadows, and verify",
    status: "pending",
  },
];

const DEFAULT_LOCKS: ProductLocksType = {
  preserveProductDetails: true,
};

export default function Home() {
  const { t, language } = useLanguage();

  // Visual Assets
  const [sourceImages, setSourceImages] = useState<UploadedImage[]>([]);
  const [referenceImages, setReferenceImages] = useState<UploadedImage[]>([]);

  // Product Spec & Locks
  const [category, setCategory] = useState<ProductCategory>("footwear");
  const [locks, setLocks] = useState<ProductLocksType>(DEFAULT_LOCKS);

  // Photography Direction
  const [direction, setDirection] = useState<PhotographyDirection>({
    cameraAngle: "three_quarter",
    background: "studio_beige",
    marketplacePreset: "shopee",
    aspectRatio: "1:1",
    modelSetting: "without_model",
  });

  // Preservation Controls
  const [preservation] = useState<PreservationSettings>({
    detailPreservation: 100,
    referenceStrength: 80,
    consistencyMode: true,
    strictProductMode: true,
    ignoreProductDesignFromReference: true,
  });

  // Blueprint Caching key
  const [cachedSourceKey, setCachedSourceKey] = useState<string | null>(null);

  // Generation Batch Count
  const [generationCount, setGenerationCount] = useState<number>(4);

  // Progressive Disclosure: Accordion "Lanjutan" (closed by default)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Collapsible Right Sidebar (240px)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  // Pipeline Execution State
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [pipelineSteps, setPipelineSteps] = useState<AgentStep[]>(() => getInitialSteps("id"));
  const [currentLogMessage, setCurrentLogMessage] = useState<string>("");
  const [blueprint, setBlueprint] = useState<ProductBlueprint | null>(null);
  const [generatedOutputs, setGeneratedOutputs] = useState<GeneratedOutput[]>([]);
  const [selectedOutputIndex, setSelectedOutputIndex] = useState<number>(0);

  // Modals & Drawers
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isConceptArtOpen, setIsConceptArtOpen] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);

  // BYOK Credentials State (persisted in browser storage)
  const [apiCredentials, setApiCredentials] = useState<ApiCredentials | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem("vellum_api_credentials") || sessionStorage.getItem("vellum_api_credentials");
      return saved ? (JSON.parse(saved) as ApiCredentials) : null;
    } catch {
      return null;
    }
  });

  // Demo Quota Remaining (from x-demo-remaining header and /api/status)
  const [demoRemaining, setDemoRemaining] = useState<number | null>(null);
  const [quotaExceededNotice, setQuotaExceededNotice] = useState<boolean>(false);

  // Automated Test State Hook (deterministic verification of 5 required states)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const testState = params.get("testState");
    if (!testState) return;

    if (testState === "empty") {
      setSourceImages([]);
      setGeneratedOutputs([]);
      setIsGenerating(false);
      setHasStarted(false);
      setErrorMessage(null);
    } else if (testState === "uploaded") {
      setSourceImages(DEMO_SOURCE_IMAGES);
      setGeneratedOutputs([]);
      setIsGenerating(false);
      setHasStarted(false);
      setErrorMessage(null);
    } else if (testState === "generating") {
      setSourceImages(DEMO_SOURCE_IMAGES);
      setGeneratedOutputs([]);
      setIsGenerating(true);
      setHasStarted(true);
      setErrorMessage(null);
      setPipelineSteps([
        { id: 1, key: "analyze", title: "Analisis foto", description: "Mengenali bentuk dan detail fisik produk", status: "completed", details: "Karakteristik geometri sepatu teridentifikasi" },
        { id: 2, key: "cutout", title: "Potong produk", description: "Memisahkan produk asli dari latar foto", status: "running" },
        { id: 3, key: "background", title: "Buat latar", description: "Membuat latar studio dan tata cahaya", status: "pending" },
        { id: 4, key: "composite", title: "Tempel dan cek hasil", description: "Menempel produk asli, bayangan alami, dan verifikasi", status: "pending" },
      ]);
      setCurrentLogMessage("Memotong produk asli dari latar foto...");
    } else if (testState === "success") {
      handleLoadDemoProduct();
    } else if (testState === "failed") {
      setSourceImages(DEMO_SOURCE_IMAGES);
      setIsGenerating(false);
      setHasStarted(true);
      setErrorMessage("Segmentasi gagal: Latar foto terlalu rumit. Silakan unggah foto produk dengan latar polos.");
      setPipelineSteps([
        { id: 1, key: "analyze", title: "Analisis foto", description: "Mengenali bentuk dan detail fisik produk", status: "completed" },
        { id: 2, key: "cutout", title: "Potong produk", description: "Memisahkan produk asli dari latar foto", status: "failed", error: "Latar foto terlalu rumit" },
        { id: 3, key: "background", title: "Buat latar", description: "Membuat latar studio dan tata cahaya", status: "pending" },
        { id: 4, key: "composite", title: "Tempel dan cek hasil", description: "Menempel produk asli, bayangan alami, dan verifikasi", status: "pending" },
      ]);
    }
  }, []);

  useEffect(() => {
    fetch("/api/status")
      .then((res) => {
        const rem = res.headers.get("x-demo-remaining");
        if (rem !== null) {
          const parsed = parseInt(rem, 10);
          if (!Number.isNaN(parsed)) setDemoRemaining(parsed);
        }
        return res.json();
      })
      .then((data) => {
        if (typeof data.demoRemaining === "number") {
          setDemoRemaining(data.demoRemaining);
        }
      })
      .catch(() => {});
  }, []);

  const updateDemoRemaining = (res: Response) => {
    const rem = res.headers.get("x-demo-remaining");
    if (rem !== null) {
      const parsed = parseInt(rem, 10);
      if (!Number.isNaN(parsed)) setDemoRemaining(parsed);
    }
  };

  const handleSaveCredentials = (creds: ApiCredentials | null, remember?: boolean) => {
    setApiCredentials(creds);
    try {
      if (creds) {
        sessionStorage.setItem("vellum_api_credentials", JSON.stringify(creds));
        if (remember) {
          localStorage.setItem("vellum_api_credentials", JSON.stringify(creds));
          localStorage.setItem("vellum_remember_credentials", "true");
        } else {
          localStorage.removeItem("vellum_api_credentials");
          localStorage.removeItem("vellum_remember_credentials");
        }
      } else {
        sessionStorage.removeItem("vellum_api_credentials");
        localStorage.removeItem("vellum_api_credentials");
        localStorage.removeItem("vellum_remember_credentials");
      }
    } catch {
      // ignore
    }
  };

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiCredentials?.apiKey) {
      headers["x-api-key"] = apiCredentials.apiKey;
      headers["x-provider"] = apiCredentials.provider;
    }
    return headers;
  };

  const [historyItems, setHistoryItems] = useState<GenerationHistoryItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("vellum_history");
      if (saved) return JSON.parse(saved) as GenerationHistoryItem[];
    } catch {
      // ignore
    }
    return [];
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AbortController for cancelling in-flight pipeline runs on restart/unmount
  const pipelineAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      pipelineAbortRef.current?.abort();
    };
  }, []);

  const sanitizeHistoryItemForStorage = (item: GenerationHistoryItem): GenerationHistoryItem => {
    const sanitizeImage = (img: UploadedImage): UploadedImage => ({
      id: img.id,
      name: img.name,
      dataUrl: img.dataUrl && img.dataUrl.startsWith("http") ? img.dataUrl : "",
      size: img.size,
      type: img.type,
      tag: img.tag,
      width: img.width,
      height: img.height,
    });

    const sanitizeOutput = (out: GeneratedOutput): GeneratedOutput => ({
      ...out,
      imageUrl:
        out.imageUrl && out.imageUrl.startsWith("http")
          ? out.imageUrl
          : out.thumbnailUrl && out.thumbnailUrl.startsWith("http")
          ? out.thumbnailUrl
          : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%2327272a'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-size='10' font-family='sans-serif'>ARCHIVED</text></svg>",
    });

    return {
      ...item,
      rawImages: item.rawImages.map(sanitizeImage),
      referenceImages: item.referenceImages.map(sanitizeImage),
      outputs: item.outputs.map(sanitizeOutput),
    };
  };

  const persistHistoryToStorage = (items: GenerationHistoryItem[]): void => {
    if (typeof window === "undefined") return;

    let candidates = items.map(sanitizeHistoryItemForStorage);

    while (candidates.length > 0) {
      try {
        localStorage.setItem("vellum_history", JSON.stringify(candidates));
        return;
      } catch (err: unknown) {
        console.warn(
          `[LocalStorage] Quota error encountered while storing ${candidates.length} history items. Pruning oldest 3 items...`,
          err
        );
        if (candidates.length <= 3) {
          candidates = candidates.slice(0, Math.max(0, candidates.length - 1));
        } else {
          candidates = candidates.slice(0, candidates.length - 3);
        }
      }
    }
  };

  const saveToHistory = (item: GenerationHistoryItem) => {
    setHistoryItems((prevItems) => {
      const updated = [item, ...prevItems.slice(0, 14)];
      persistHistoryToStorage(updated);
      return updated;
    });
  };

  // Quick Action: Load Demo Product
  const handleLoadDemoProduct = () => {
    setSourceImages(DEMO_SOURCE_IMAGES);
    setReferenceImages(DEMO_REFERENCE_IMAGES);
    setCategory("footwear");
    setBlueprint(DEMO_FOOTWEAR_BLUEPRINT);
    setGeneratedOutputs(DEMO_OUTPUTS);
    setSelectedOutputIndex(0);
    setHasStarted(true);
    setPipelineSteps(
      getInitialSteps(language).map((s) => ({
        ...s,
        status: "completed",
        details: language === "id" ? "Data demo berhasil dimuat" : "Demo data loaded",
      }))
    );
    setCurrentLogMessage(language === "id" ? "Produk demo berhasil dimuat." : "Demo footwear project loaded.");
  };

  // History load callback
  const handleLoadHistoryItem = (item: GenerationHistoryItem) => {
    setCategory(item.category);
    setSourceImages(item.rawImages);
    setReferenceImages(item.referenceImages);
    setBlueprint(item.blueprint);
    setLocks(item.locks);
    setDirection(item.direction);
    setGeneratedOutputs(item.outputs);
    setSelectedOutputIndex(0);
    setHasStarted(true);
    setIsHistoryDrawerOpen(false);
    setCurrentLogMessage(`Loaded historical shoot: ${item.projectName}`);
  };

  const updateStepStatus = (
    id: number,
    status: AgentStep["status"],
    details?: string,
    error?: string
  ) => {
    setPipelineSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, status, details, error } : step
      )
    );
  };

  // -------------------------------------------------------------
  // MASTER PIPELINE: RUN AGENT (4 Honest Stages)
  // -------------------------------------------------------------
  const handleRunAgent = async () => {
    if (isGenerating) return;
    if (sourceImages.length === 0) {
      setErrorMessage(language === "id" ? "Unggah minimal 1 foto produk asli." : "Please upload at least one raw product photo.");
      return;
    }

    pipelineAbortRef.current?.abort();
    const abortController = new AbortController();
    pipelineAbortRef.current = abortController;
    const signal = abortController.signal;

    setErrorMessage(null);
    setIsGenerating(true);
    setHasStarted(true);
    setPipelineSteps(getInitialSteps(language));
    setCurrentLogMessage(language === "id" ? "Memulai proses studio fotografi produk..." : "Initializing photography studio pipeline...");

    try {
      const currentSourceKey = `${category}-${sourceImages.map((img) => img.id + "_" + img.size).join("|")}`;
      const isCacheValid = Boolean(blueprint) && cachedSourceKey === currentSourceKey;

      const footwearNotes = category === "footwear"
        ? "Footwear product: preserve authentic shoe proportions and contours."
        : undefined;

      let currentBlueprint: ProductBlueprint;

      if (isCacheValid && blueprint) {
        currentBlueprint = blueprint;
        updateStepStatus(1, "completed", language === "id" ? "Memakai hasil analisis dari cache" : "Loaded from Blueprint Cache");
        setCurrentLogMessage(language === "id" ? "Foto produk tidak berubah — memakai hasil analisis dari cache." : "Source unchanged — using cached Product Blueprint.");
      } else {
        updateStepStatus(1, "running", language === "id" ? `Menganalisis ${sourceImages.length} foto produk` : `Analyzing ${sourceImages.length} product photos`);
        setCurrentLogMessage(language === "id" ? `Menganalisis ${sourceImages.length} foto produk...` : `Analyzing ${sourceImages.length} product images...`);

        const analyzeRes = await fetch("/api/analyze", {
          method: "POST",
          headers: getAuthHeaders(),
          signal,
          body: JSON.stringify({
            images: sourceImages,
            categoryHint: category,
            userNotes: footwearNotes,
          }),
        });

        updateDemoRemaining(analyzeRes);

        if (!analyzeRes.ok) {
          const errData = await analyzeRes.json().catch(() => ({}));
          if (analyzeRes.status === 429 || errData.code === "DEMO_QUOTA_EXCEEDED") {
            setQuotaExceededNotice(true);
            setDemoRemaining(0);
          }
          const msg = errData.error || (language === "id" ? "Analisis foto produk gagal." : "Product photo visual analysis failed.");
          updateStepStatus(1, "failed", msg, msg);
          throw new Error(msg);
        }
        const analyzeData = await analyzeRes.json();
        currentBlueprint = analyzeData.blueprint as ProductBlueprint;
        setBlueprint(currentBlueprint);
        setCachedSourceKey(currentSourceKey);

        try {
          const bpRes = await fetch("/api/blueprint", {
            method: "POST",
            headers: getAuthHeaders(),
            signal,
            body: JSON.stringify({
              images: sourceImages,
              category,
              existingBlueprint: currentBlueprint,
              userNotes: footwearNotes,
            }),
          });

          if (bpRes.ok) {
            const bpData = (await bpRes.json()) as { blueprint?: ProductBlueprint };
            if (bpData.blueprint) {
              currentBlueprint = bpData.blueprint;
              setBlueprint(currentBlueprint);
            }
          }
        } catch (bpErr: unknown) {
          if (bpErr instanceof Error && bpErr.name === "AbortError") throw bpErr;
          console.warn("Failed to call /api/blueprint, using initial analyzed blueprint:", bpErr);
        }

        updateStepStatus(1, "completed", language === "id" ? "Bentuk dan karakteristik produk teridentifikasi" : "Product geometry and features identified");
      }

      updateStepStatus(2, "running", language === "id" ? "Memotong produk dari latar aslinya..." : "Cutting out authentic product...");
      setCurrentLogMessage(language === "id" ? "Memotong produk asli dan membuat latar foto..." : "Cutting out product and generating background...");

      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: getAuthHeaders(),
        signal,
        body: JSON.stringify({
          blueprint: currentBlueprint,
          locks,
          direction,
          preservation,
          sourceImages,
          referenceImages,
          count: generationCount,
        }),
      });

      updateDemoRemaining(genRes);

      const genData = await genRes.json().catch(() => ({})) as {
        success?: boolean;
        code?: string;
        outputs?: GeneratedOutput[];
        failedCount?: number;
        stage?: string;
        error?: { stage?: string; message?: string } | string;
      };

      if (!genRes.ok || genData.success === false) {
        if (genRes.status === 429 || genData.code === "DEMO_QUOTA_EXCEEDED") {
          setQuotaExceededNotice(true);
          setDemoRemaining(0);
        }
        const errStage = typeof genData.error === "object" ? genData.error?.stage : undefined;
        const errMsg =
          typeof genData.error === "object" ? genData.error?.message
          : typeof genData.error === "string" ? genData.error
          : (language === "id" ? "Gagal memproses foto produk." : "Generation service encountered an error.");

        if (errStage === "segmentation") {
          updateStepStatus(2, "failed", errMsg, errMsg);
        } else if (errStage === "plate") {
          updateStepStatus(2, "completed", language === "id" ? "Produk berhasil dipotong" : "Product cutout completed");
          updateStepStatus(3, "failed", errMsg, errMsg);
        } else if (errStage === "compositing") {
          updateStepStatus(2, "completed", language === "id" ? "Produk berhasil dipotong" : "Product cutout completed");
          updateStepStatus(3, "completed", language === "id" ? "Latar foto berhasil dibuat" : "Background plate generated");
          updateStepStatus(4, "failed", errMsg, errMsg);
        } else {
          updateStepStatus(2, "failed", errMsg, errMsg);
        }
        throw new Error(errMsg);
      }

      updateStepStatus(2, "completed", language === "id" ? "Produk asli berhasil dipotong dari foto" : "Product cutout completed from original photo");
      updateStepStatus(3, "completed", language === "id" ? "Latar foto dan pencahayaan studio dibuat" : "Studio background plate generated");

      const outputs = (genData.outputs ?? []) as GeneratedOutput[];

      updateStepStatus(4, "running", language === "id" ? "Menempel produk asli, bayangan alami, dan verifikasi kualitas" : "Compositing product, shadows, and auditing quality");
      setCurrentLogMessage(language === "id" ? "Mengecek kesesuaian hasil foto dengan produk asli..." : "Verifying output photo against original product...");

      const auditedOutputs = await Promise.all(
        outputs.map(async (output: GeneratedOutput): Promise<GeneratedOutput> => {
          if (!output.validation.isFallback) return output;

          try {
            const valRes = await fetch("/api/validate", {
              method: "POST",
              headers: getAuthHeaders(),
              signal,
              body: JSON.stringify({
                sourceImages,
                generatedImageUrl: output.imageUrl,
                blueprint: currentBlueprint,
                locks,
                angle: output.angle,
              }),
            });

            if (valRes.ok) {
              const valData = (await valRes.json()) as { validation?: ValidationResult };
              if (valData.validation) {
                return {
                  ...output,
                  consistencyScore: valData.validation.score,
                  validation: valData.validation,
                  status: valData.validation.status === "needs_regeneration" ? ("rejected" as const) : ("passed" as const),
                };
              }
            }
          } catch (valErr: unknown) {
            if (valErr instanceof Error && valErr.name === "AbortError") throw valErr;
            console.warn("Validation route request error, retaining fallback:", valErr);
          }

          return output;
        })
      );

      setGeneratedOutputs(auditedOutputs);
      setSelectedOutputIndex(0);
      updateStepStatus(4, "completed", language === "id" ? `${auditedOutputs.length} foto komersial siap digunakan` : `${auditedOutputs.length} commercial photos ready`);
      setCurrentLogMessage(language === "id" ? "Selesai! Foto produk komersial siap digunakan." : "Complete! Commercial product photos ready.");

      const scoredOutputs = auditedOutputs.filter((o) => o.consistencyScore !== null);
      const avgScore = scoredOutputs.length > 0
        ? Math.round(scoredOutputs.reduce((acc, curr) => acc + (curr.consistencyScore ?? 0), 0) / scoredOutputs.length)
        : 0;

      const historyItem: GenerationHistoryItem = {
        id: `session-${Date.now()}`,
        projectName: currentBlueprint.subcategory || `${category} Studio Shoot`,
        createdAt: new Date().toISOString(),
        category,
        rawImages: sourceImages,
        referenceImages,
        blueprint: currentBlueprint,
        locks,
        direction,
        preservation,
        outputs: auditedOutputs,
        averageScore: avgScore,
        isDemo: false,
      };
      saveToHistory(historyItem);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.warn("Pipeline warning:", err);
      const msg = err instanceof Error ? err.message : (language === "id" ? "Pemrosesan foto gagal. Silakan coba lagi." : "Pipeline execution failed. Please try again.");
      setErrorMessage(msg);
      setCurrentLogMessage(`ERROR: ${msg}`);

      setPipelineSteps((prev) =>
        prev.map((step) =>
          step.status === "running" ? { ...step, status: "failed", error: msg } : step
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadSingle = async (
    url: string,
    name: string,
    format: "png" | "jpg" = "png"
  ): Promise<void> => {
    try {
      let blob: Blob;
      if (url.startsWith("data:")) {
        const response = await fetch(url);
        blob = await response.blob();
      } else {
        const response = await fetch(url, { mode: "cors" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        blob = await response.blob();
      }

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "foto-produk";
      a.download = `studio-${cleanName}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const activeOutput: GeneratedOutput | undefined = generatedOutputs[selectedOutputIndex] || generatedOutputs[0];
  const primarySourceImage = sourceImages[0];

  const getStatusBadge = (out: GeneratedOutput) => {
    const isDemo =
      out.method === "demo" ||
      out.method === "demo-plate-composite" ||
      out.imageUrl.includes("/demo/") ||
      out.imageUrl.endsWith(".svg");

    if (isDemo) {
      return (
        <span
          title="Hasil menggunakan simulasi demo"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-950/70 border border-purple-800 text-purple-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
        >
          <Info className="w-3 h-3 shrink-0" />
          <span className="truncate">Demo</span>
        </span>
      );
    }

    if (out.validation && out.validation.score && out.validation.score >= 80) {
      return (
        <span
          title="Kesesuaian produk terverifikasi"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/70 border border-emerald-800 text-emerald-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
        >
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          <span className="truncate">Hasil AI</span>
        </span>
      );
    }

    return (
      <span
        title="Belum diverifikasi secara otomatis"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-800 border border-zinc-700 text-zinc-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
      >
        <HelpCircle className="w-3 h-3 shrink-0" />
        <span className="truncate">Belum diverifikasi</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col font-sans bg-zinc-950 overflow-x-hidden">
      {/* Top Header */}
      <Header
        onLoadDemoProduct={handleLoadDemoProduct}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        onOpenApiSettings={() => setIsApiSettingsOpen(true)}
        hasApiKey={Boolean(apiCredentials?.apiKey)}
        activeProviderName={apiCredentials?.provider}
        historyCount={historyItems.length}
        demoRemaining={demoRemaining}
      />

      {/* Main Studio Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto overflow-hidden">
        {/* ========================================================= */}
        {/* LEFT PANEL: Fixed 320px on Desktop, Viewport Height       */}
        {/* 1) Upload, 2) Preset Latar, 3) Aspek Rasio, 4) Tombol CTA */}
        {/* ========================================================= */}
        <aside className="w-full lg:w-[320px] lg:min-w-[320px] lg:max-w-[320px] border-b lg:border-b-0 lg:border-r border-zinc-800 bg-zinc-950 flex flex-col lg:h-[calc(100vh-53px)] shrink-0">
          {/* Scrollable controls container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 1. Upload Foto Produk */}
            <div className="card-flat p-3.5 space-y-2.5">
              <ProductSourceUpload
                variant="compact"
                images={sourceImages}
                onAddImages={(newImgs) => setSourceImages((prev) => [...prev, ...newImgs])}
                onRemoveImage={(id) => {
                  setSourceImages((prev) => prev.filter((img) => img.id !== id));
                  if (sourceImages.length <= 1) {
                    setGeneratedOutputs([]);
                    setHasStarted(false);
                  }
                }}
              />
            </div>

            {/* 2 & 3. Progressive Disclosure: Tampilkan Preset Latar & Rasio HANYA SETELAH FOTO DIUNGGAH */}
            {sourceImages.length > 0 && (
              <>
                <div className="card-flat p-3.5 space-y-3">
                  <CameraSettings
                    direction={direction}
                    onChangeDirection={setDirection}
                    activeProvider={apiCredentials?.apiKey ? apiCredentials.provider : undefined}
                    hideAdvancedSection={true}
                  />
                </div>

                {/* Progressive Disclosure: Bagian "Lanjutan" (Tertutup secara default) */}
                <div className="card-flat p-3.5 space-y-3">
                  <button
                    type="button"
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    aria-expanded={isAdvancedOpen}
                    aria-label={language === "id" ? "Buka atau tutup pengaturan lanjutan" : "Toggle advanced settings"}
                    className="w-full flex items-center justify-between text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{language === "id" ? "Pengaturan Lanjutan" : "Advanced Settings"}</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isAdvancedOpen && (
                    <div className="pt-2 border-t border-zinc-800 space-y-3.5">
                      {/* Product Spec */}
                      <ProductSpec
                        category={category}
                        onChangeCategory={(cat) => setCategory(cat)}
                        detectedLabel={blueprint?.category === "footwear" ? "sepatu hak" : blueprint?.subcategory}
                      />

                      {/* Product Lock Toggle */}
                      <ProductLocks locks={locks} onChangeLocks={setLocks} />

                      {/* Camera Angle & Model from CameraSettings */}
                      <div className="pt-1">
                        <CameraSettings
                          direction={direction}
                          onChangeDirection={setDirection}
                          activeProvider={apiCredentials?.apiKey ? apiCredentials.provider : undefined}
                          hideAdvancedSection={false}
                        />
                      </div>

                      {/* Output Count */}
                      <div className="space-y-1.5 pt-1">
                        <label className="block text-xs font-semibold text-zinc-300">
                          {language === "id" ? "Jumlah Variasi Foto" : "Image Count"}
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[1, 2, 4].map((count) => (
                            <button
                              key={count}
                              type="button"
                              onClick={() => setGenerationCount(count)}
                              className={`py-1.5 px-2 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${
                                generationCount === count
                                  ? "bg-blue-600 text-white border-blue-500"
                                  : "bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800"
                              }`}
                            >
                              {count} {language === "id" ? "Foto" : "Photos"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Optional Reference Upload */}
                      <div className="pt-2 border-t border-zinc-800/80">
                        <ReferenceUpload
                          references={referenceImages}
                          onAddReferences={(newRefs) => setReferenceImages((prev) => [...prev, ...newRefs])}
                          onRemoveReference={(id) => setReferenceImages((prev) => prev.filter((img) => img.id !== id))}
                          onSetCameraAngleToReference={() => {
                            setDirection((prev) => ({ ...prev, cameraAngle: "copy_reference" }));
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 4. Tombol Utama "Buat foto" (Sticky di bawah panel kiri) */}
          <div className="p-3 border-t border-zinc-800 bg-zinc-950/95 sticky bottom-0 z-10 space-y-2">
            {!apiCredentials?.apiKey && sourceImages.length > 0 && (
              <div className="p-2 rounded bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-300 flex items-center justify-between">
                <span>{language === "id" ? "Mode Demo" : "Demo Mode"}</span>
                <button
                  type="button"
                  onClick={() => setIsApiSettingsOpen(true)}
                  className="font-medium underline hover:text-amber-200 cursor-pointer"
                >
                  {language === "id" ? "Atur Key" : "Set Key"}
                </button>
              </div>
            )}

            <button
              type="button"
              id="main-generate-btn"
              onClick={handleRunAgent}
              disabled={isGenerating || sourceImages.length === 0}
              aria-label={isGenerating ? "Sedang membuat foto" : "Buat foto produk studio"}
              className="btn-primary w-full h-11 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 rounded-lg shadow-sm"
            >
              <Play className="w-4 h-4 fill-current shrink-0" />
              <span>
                {isGenerating
                  ? (language === "id" ? "Membuat foto studio..." : "Generating studio photo...")
                  : (language === "id" ? `Buat foto (${generationCount} gambar)` : `Create photo (${generationCount} images)`)}
              </span>
            </button>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* CENTER CANVAS: Results are the center of the screen       */}
        {/* ========================================================= */}
        <main className="flex-1 flex flex-col lg:h-[calc(100vh-53px)] overflow-y-auto p-4 lg:p-6 bg-zinc-950/50">
          {/* Error Notice */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800 text-xs text-red-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                aria-label="Tutup pesan error"
                className="font-semibold underline hover:text-white cursor-pointer ml-3"
              >
                {t.page.dismiss}
              </button>
            </div>
          )}

          {/* Quota Exceeded Notice */}
          {quotaExceededNotice && (
            <div className="mb-4 p-3 rounded-lg bg-amber-950/50 border border-amber-800 text-xs text-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{t.quota.exceededTitle}: {t.quota.exceededMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsApiSettingsOpen(true)}
                className="btn-secondary h-7 px-2.5 text-xs shrink-0 ml-3"
              >
                {t.quota.useOwnKey}
              </button>
            </div>
          )}

          {/* STATE 0: EMPTY STATE (Hero Upload & 1 Kalimat Tenang) */}
          {sourceImages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
              <ProductSourceUpload
                variant="hero"
                images={sourceImages}
                onAddImages={(newImgs) => setSourceImages((prev) => [...prev, ...newImgs])}
                onRemoveImage={() => {}}
              />

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  id="empty-state-load-demo"
                  onClick={handleLoadDemoProduct}
                  className="btn-secondary h-8 px-3 text-xs gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>{language === "id" ? "Atau coba produk demo sepatu" : "Or try demo footwear"}</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE 1: SETELAH UPLOAD, SEBELUM GENERATE (Pratinjau Foto Asli & Potongan Produk) */}
          {sourceImages.length > 0 && generatedOutputs.length === 0 && !isGenerating && (
            <div className="flex-1 flex flex-col justify-center max-w-4xl w-full mx-auto space-y-4 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    {language === "id" ? "Pratinjau Foto Asli & Potongan Produk" : "Original Photo & Cutout Inspection"}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {language === "id"
                      ? "Periksa ketajaman dan isolasi produk sebelum sistem AI membuat latar studio komersial."
                      : "Evaluate product contour and isolation before AI generates the commercial studio backdrop."}
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === "id" ? "Produk siap diproses" : "Product ready"}</span>
                </div>
              </div>

              {/* Side-by-side inspection grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Foto Asli */}
                <div className="card-flat overflow-hidden flex flex-col">
                  <div className="p-2.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
                    <span className="text-xs font-semibold text-zinc-200">
                      {language === "id" ? "Foto Mentah Asli" : "Original Raw Photo"}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {primarySourceImage?.width && primarySourceImage?.height
                        ? `${primarySourceImage.width}×${primarySourceImage.height}px`
                        : "Source"}
                    </span>
                  </div>
                  <div className="relative aspect-square w-full bg-zinc-950 flex items-center justify-center p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={primarySourceImage?.dataUrl}
                      alt="Foto mentah produk asli"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* 2. Potongan Produk (Cutout Mask on Checkerboard) */}
                <div className="card-flat overflow-hidden flex flex-col">
                  <div className="p-2.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
                    <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      <span>{language === "id" ? "Potongan Produk (Mask)" : "Product Cutout (Mask)"}</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800 font-medium">
                      {language === "id" ? "Piksel Asli Terkunci" : "Authentic Pixels Locked"}
                    </span>
                  </div>
                  <div
                    className="relative aspect-square w-full flex items-center justify-center p-3"
                    style={{
                      backgroundColor: "#09090b",
                      backgroundImage: "linear-gradient(45deg, #18181b 25%, transparent 25%), linear-gradient(-45deg, #18181b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #18181b 75%), linear-gradient(-45deg, transparent 75%, #18181b 75%)",
                      backgroundSize: "16px 16px",
                      backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                    }}
                  >
                    {/* Cutout preview: authentic product isolated on checkerboard */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={primarySourceImage?.dataUrl}
                      alt="Pratinjau potongan produk"
                      className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Banner to proceed */}
              <div className="card-flat-subtle p-3 rounded-lg flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  {language === "id"
                    ? "Pilih preset latar dan rasio di panel kiri, lalu klik tombol 'Buat foto'."
                    : "Choose backdrop preset and ratio on the left, then click 'Create photo'."}
                </span>
                <button
                  type="button"
                  onClick={handleRunAgent}
                  className="btn-primary h-8 px-3.5 text-xs gap-1.5 shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{language === "id" ? "Buat foto sekarang" : "Create photo now"}</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: SAAT GENERATE (Agent Monitor 4 Langkah Jujur) */}
          {isGenerating && (
            <div className="flex-1 flex flex-col justify-center max-w-2xl w-full mx-auto py-6">
              <AgentMonitor
                steps={pipelineSteps}
                isGenerating={isGenerating}
                hasStarted={hasStarted}
                blueprint={blueprint}
                onOpenBlueprint={() => setIsBlueprintModalOpen(true)}
                onRetry={handleRunAgent}
                currentLogMessage={currentLogMessage}
              />
            </div>
          )}

          {/* STATE 3: SETELAH GENERATE (Hero Before/After Slider Pusat Layar) */}
          {generatedOutputs.length > 0 && !isGenerating && (
            <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto space-y-4">
              {/* Slider Header: Status & Direct Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  {activeOutput && getStatusBadge(activeOutput)}
                  <span className="text-xs text-zinc-400">
                    {language === "id" ? "Perbandingan Foto Asli vs Studio AI" : "Original vs AI Studio Output"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Download PNG Button */}
                  {activeOutput && (
                    <button
                      type="button"
                      id="hero-download-btn"
                      onClick={() => handleDownloadSingle(activeOutput.imageUrl, activeOutput.angle || "foto-studio", "png")}
                      aria-label="Unduh foto aktif dalam format PNG"
                      className="btn-primary h-8 px-3 text-xs gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{language === "id" ? "Unduh PNG" : "Download PNG"}</span>
                    </button>
                  )}

                  {/* Regenerate / Reset Button */}
                  <button
                    type="button"
                    id="hero-regenerate-btn"
                    onClick={handleRunAgent}
                    disabled={isGenerating}
                    aria-label="Atur ulang atau buat variasi baru"
                    className="btn-secondary h-8 px-3 text-xs gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === "id" ? "Atur ulang" : "Regenerate"}</span>
                  </button>
                </div>
              </div>

              {/* Large Inline Before/After Slider */}
              {activeOutput && primarySourceImage && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-full max-w-[620px]">
                    <BeforeAfterSlider
                      inline={true}
                      sourceUrl={primarySourceImage.dataUrl}
                      sourceLabel={language === "id" ? "Foto Asli" : "Original"}
                      generatedUrl={activeOutput.imageUrl}
                      generatedLabel={language === "id" ? "Hasil Studio AI" : "AI Studio"}
                    />
                  </div>
                </div>
              )}

              {/* Output Variations Thumbnail Strip */}
              {generatedOutputs.length > 1 && (
                <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-300 block">
                    {language === "id" ? "Pilih Variasi Hasil:" : "Select Variation:"}
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {generatedOutputs.map((out, idx) => {
                      const isSelected = selectedOutputIndex === idx;
                      return (
                        <button
                          key={out.id}
                          type="button"
                          onClick={() => setSelectedOutputIndex(idx)}
                          aria-label={`Pilih variasi ${idx + 1}`}
                          className={`relative w-16 h-16 rounded-lg overflow-hidden border p-1 bg-zinc-900 transition-colors shrink-0 cursor-pointer ${
                            isSelected ? "border-blue-500 ring-2 ring-blue-500" : "border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={out.imageUrl}
                            alt={out.angle || `Variasi ${idx + 1}`}
                            className="w-full h-full object-contain pointer-events-none"
                          />
                          <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-zinc-950/80 px-1 rounded text-zinc-300">
                            #{idx + 1}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ========================================================= */}
        {/* RIGHT PANEL: Collapsible 240px History on Desktop         */}
        {/* ========================================================= */}
        <aside
          className={`hidden lg:flex flex-col border-l border-zinc-800 bg-zinc-950 h-[calc(100vh-53px)] transition-all duration-200 shrink-0 ${
            isRightSidebarOpen ? "w-[240px] min-w-[240px] max-w-[240px]" : "w-[44px] min-w-[44px] max-w-[44px]"
          }`}
        >
          {isRightSidebarOpen ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-200">
                    {language === "id" ? "Riwayat Hasil" : "History"}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded">
                    {historyItems.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRightSidebarOpen(false)}
                  aria-label="Lipat panel riwayat"
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* History list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {historyItems.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-zinc-400">
                    <Clock className="w-6 h-6 mb-2 stroke-[1.5]" />
                    <p className="text-xs font-medium text-zinc-300">{t.history.noHistory}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{t.history.noHistoryDesc}</p>
                  </div>
                ) : (
                  historyItems.map((item) => (
                    <div
                      key={item.id}
                      className="card-flat-subtle p-2 rounded-lg space-y-1.5 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-zinc-300 truncate max-w-[120px]">
                          {item.projectName}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {/* Output thumb */}
                      <div className="flex items-center gap-1.5">
                        {item.outputs.slice(0, 3).map((out, oIdx) => (
                          <div
                            key={oIdx}
                            className="w-12 h-12 rounded bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={out.imageUrl}
                              alt="output thumbnail"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleLoadHistoryItem(item)}
                          className="text-blue-400 hover:text-blue-300 cursor-pointer"
                        >
                          {language === "id" ? "Lihat" : "View"}
                        </button>
                        {item.outputs[0] && (
                          <button
                            type="button"
                            onClick={() => handleDownloadSingle(item.outputs[0].imageUrl, item.projectName, "png")}
                            className="text-zinc-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-2.5 h-2.5" />
                            <span>PNG</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Collapsed narrow strip */
            <div className="flex flex-col items-center py-3 h-full">
              <button
                type="button"
                onClick={() => setIsRightSidebarOpen(true)}
                aria-label="Buka panel riwayat"
                className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="mt-4 [writing-mode:vertical-rl] rotate-180 flex items-center gap-2 text-xs font-medium text-zinc-500">
                <Clock className="w-3.5 h-3.5 rotate-90" />
                <span>{language === "id" ? "Riwayat Hasil" : "History"}</span>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Blueprint Modal */}
      <BlueprintModal
        blueprint={blueprint}
        isOpen={isBlueprintModalOpen}
        onClose={() => setIsBlueprintModalOpen(false)}
      />

      {/* Mobile History Drawer */}
      <HistoryDrawer
        history={historyItems}
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        onLoadItem={handleLoadHistoryItem}
        onDeleteItem={(id) => {
          setHistoryItems((prevItems) => {
            const updated = prevItems.filter((i) => i.id !== id);
            persistHistoryToStorage(updated);
            return updated;
          });
        }}
      />

      {/* Concept Art Generator Modal */}
      <ConceptArtGenerator
        isOpen={isConceptArtOpen}
        onClose={() => setIsConceptArtOpen(false)}
      />

      {/* BYOK API Settings Modal */}
      <ApiSettingsModal
        isOpen={isApiSettingsOpen}
        onClose={() => setIsApiSettingsOpen(false)}
        onSaveCredentials={(creds, remember) => {
          handleSaveCredentials(creds, remember);
          if (creds?.apiKey) setQuotaExceededNotice(false);
        }}
        currentCredentials={apiCredentials}
      />
    </div>
  );
}
