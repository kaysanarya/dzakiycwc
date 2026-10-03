"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
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

export const getInitialSteps = (language: "en" | "id"): AgentStep[] => [
  {
    id: 1,
    key: "analyze",
    title: language === "id" ? "Analisis foto" : "Analyze photo",
    description:
      language === "id"
        ? "Mengenali bentuk dan detail fisik produk"
        : "Extract product features and category",
    status: "pending",
  },
  {
    id: 2,
    key: "cutout",
    title: language === "id" ? "Potong produk" : "Cut out product",
    description:
      language === "id"
        ? "Memisahkan produk asli dari latar foto"
        : "Isolate product from original background",
    status: "pending",
  },
  {
    id: 3,
    key: "background",
    title: language === "id" ? "Buat latar" : "Generate background",
    description:
      language === "id"
        ? "Membuat latar studio dan tata cahaya"
        : "Create studio background plate",
    status: "pending",
  },
  {
    id: 4,
    key: "composite",
    title: language === "id" ? "Tempel dan cek hasil" : "Composite & review",
    description:
      language === "id"
        ? "Menempel produk asli, bayangan alami, dan verifikasi"
        : "Paste authentic product, shadows, and verify",
    status: "pending",
  },
];

const DEFAULT_LOCKS: ProductLocksType = {
  preserveProductDetails: true,
};

export function useStudioSession() {
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
  const [pipelineSteps, setPipelineSteps] = useState<AgentStep[]>(() =>
    getInitialSteps("id")
  );
  const [currentLogMessage, setCurrentLogMessage] = useState<string>("");
  const [blueprint, setBlueprint] = useState<ProductBlueprint | null>(null);
  const [generatedOutputs, setGeneratedOutputs] = useState<GeneratedOutput[]>([]);
  const [selectedOutputIndex, setSelectedOutputIndex] = useState<number>(0);

  // Modals & Drawers
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isConceptArtOpen, setIsConceptArtOpen] = useState(false);

  // Demo Quota Remaining
  const [demoRemaining, setDemoRemaining] = useState<number | null>(null);
  const [quotaExceededNotice, setQuotaExceededNotice] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // History State
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

  // AbortController for cancelling in-flight pipeline runs on restart/unmount
  const pipelineAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      pipelineAbortRef.current?.abort();
    };
  }, []);

  // Fetch initial status / quota
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

  const getAuthHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
  });

  const sanitizeHistoryItemForStorage = (
    item: GenerationHistoryItem
  ): GenerationHistoryItem => {
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

  const handleDeleteHistoryItem = (id: string) => {
    setHistoryItems((prevItems) => {
      const updated = prevItems.filter((i) => i.id !== id);
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
        details:
          language === "id"
            ? "Data demo berhasil dimuat"
            : "Demo data loaded",
      }))
    );
    setCurrentLogMessage(
      language === "id"
        ? "Produk demo berhasil dimuat."
        : "Demo footwear project loaded."
    );
  };

  // Automated Test State Hook (deterministic verification of 5 required states for audit)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const testState = params.get("testState");
    if (!testState) return;

    /* eslint-disable react-hooks/set-state-in-effect */
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
        {
          id: 1,
          key: "analyze",
          title: "Analisis foto",
          description: "Mengenali bentuk dan detail fisik produk",
          status: "completed",
          details: "Karakteristik geometri sepatu teridentifikasi",
        },
        {
          id: 2,
          key: "cutout",
          title: "Potong produk",
          description: "Memisahkan produk asli dari latar foto",
          status: "running",
        },
        {
          id: 3,
          key: "background",
          title: "Buat latar",
          description: "Membuat latar studio dan tata cahaya",
          status: "pending",
        },
        {
          id: 4,
          key: "composite",
          title: "Tempel dan cek hasil",
          description: "Menempel produk asli, bayangan alami, dan verifikasi",
          status: "pending",
        },
      ]);
      setCurrentLogMessage("Memotong produk asli dari latar foto...");
    } else if (testState === "success") {
      handleLoadDemoProduct();
    } else if (testState === "failed") {
      setSourceImages(DEMO_SOURCE_IMAGES);
      setIsGenerating(false);
      setHasStarted(true);
      setErrorMessage(
        "Segmentasi gagal: Latar foto terlalu rumit. Silakan unggah foto produk dengan latar polos."
      );
      setPipelineSteps([
        {
          id: 1,
          key: "analyze",
          title: "Analisis foto",
          description: "Mengenali bentuk dan detail fisik produk",
          status: "completed",
        },
        {
          id: 2,
          key: "cutout",
          title: "Potong produk",
          description: "Memisahkan produk asli dari latar foto",
          status: "failed",
          error: "Latar foto terlalu rumit",
        },
        {
          id: 3,
          key: "background",
          title: "Buat latar",
          description: "Membuat latar studio dan tata cahaya",
          status: "pending",
        },
        {
          id: 4,
          key: "composite",
          title: "Tempel dan cek hasil",
          description: "Menempel produk asli, bayangan alami, dan verifikasi",
          status: "pending",
        },
      ]);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleRunAgent = async () => {
    if (isGenerating) return;
    if (sourceImages.length === 0) {
      setErrorMessage(
        language === "id"
          ? "Unggah minimal 1 foto produk asli."
          : "Please upload at least one raw product photo."
      );
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
    setCurrentLogMessage(
      language === "id"
        ? "Memulai proses studio fotografi produk..."
        : "Initializing photography studio pipeline..."
    );

    try {
      const currentSourceKey = `${category}-${sourceImages
        .map((img) => img.id + "_" + img.size)
        .join("|")}`;
      const isCacheValid =
        Boolean(blueprint) && cachedSourceKey === currentSourceKey;

      const footwearNotes =
        category === "footwear"
          ? "Footwear product: preserve authentic shoe proportions and contours."
          : undefined;

      let currentBlueprint: ProductBlueprint;

      if (isCacheValid && blueprint) {
        currentBlueprint = blueprint;
        updateStepStatus(
          1,
          "completed",
          language === "id"
            ? "Memakai hasil analisis dari cache"
            : "Loaded from Blueprint Cache"
        );
        setCurrentLogMessage(
          language === "id"
            ? "Foto produk tidak berubah — memakai hasil analisis dari cache."
            : "Source unchanged — using cached Product Blueprint."
        );
      } else {
        updateStepStatus(
          1,
          "running",
          language === "id"
            ? `Menganalisis ${sourceImages.length} foto produk`
            : `Analyzing ${sourceImages.length} product photos`
        );
        setCurrentLogMessage(
          language === "id"
            ? `Menganalisis ${sourceImages.length} foto produk...`
            : `Analyzing ${sourceImages.length} product images...`
        );

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
          if (
            analyzeRes.status === 429 ||
            errData.code === "DEMO_QUOTA_EXCEEDED"
          ) {
            setQuotaExceededNotice(true);
            setDemoRemaining(0);
          }

          const msg =
            errData.error ||
            (language === "id"
              ? "Analisis foto produk gagal."
              : "Product photo visual analysis failed.");
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
            const bpData = (await bpRes.json()) as {
              blueprint?: ProductBlueprint;
            };
            if (bpData.blueprint) {
              currentBlueprint = bpData.blueprint;
              setBlueprint(currentBlueprint);
            }
          }
        } catch (bpErr: unknown) {
          if (bpErr instanceof Error && bpErr.name === "AbortError")
            throw bpErr;
          console.warn(
            "Failed to call /api/blueprint, using initial analyzed blueprint:",
            bpErr
          );
        }

        updateStepStatus(
          1,
          "completed",
          language === "id"
            ? "Bentuk dan karakteristik produk teridentifikasi"
            : "Product geometry and features identified"
        );
      }

      updateStepStatus(
        2,
        "running",
        language === "id"
          ? "Memotong produk dari latar aslinya..."
          : "Cutting out authentic product..."
      );
      setCurrentLogMessage(
        language === "id"
          ? "Memotong produk asli dan membuat latar foto..."
          : "Cutting out product and generating background..."
      );

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

      const genData = (await genRes.json().catch(() => ({}))) as {
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

        const errStage =
          typeof genData.error === "object"
            ? genData.error?.stage
            : undefined;
        const errMsg =
          typeof genData.error === "object"
            ? genData.error?.message
            : typeof genData.error === "string"
            ? genData.error
            : language === "id"
            ? "Gagal memproses foto produk."
            : "Generation service encountered an error.";

        if (errStage === "segmentation") {
          updateStepStatus(2, "failed", errMsg, errMsg);
        } else if (errStage === "plate") {
          updateStepStatus(
            2,
            "completed",
            language === "id"
              ? "Produk berhasil dipotong"
              : "Product cutout completed"
          );
          updateStepStatus(3, "failed", errMsg, errMsg);
        } else if (errStage === "compositing") {
          updateStepStatus(
            2,
            "completed",
            language === "id"
              ? "Produk berhasil dipotong"
              : "Product cutout completed"
          );
          updateStepStatus(
            3,
            "completed",
            language === "id"
              ? "Latar foto berhasil dibuat"
              : "Background plate generated"
          );
          updateStepStatus(4, "failed", errMsg, errMsg);
        } else {
          updateStepStatus(2, "failed", errMsg, errMsg);
        }
        throw new Error(errMsg);
      }

      updateStepStatus(
        2,
        "completed",
        language === "id"
          ? "Produk asli berhasil dipotong dari foto"
          : "Product cutout completed from original photo"
      );
      updateStepStatus(
        3,
        "completed",
        language === "id"
          ? "Latar foto dan pencahayaan studio dibuat"
          : "Studio background plate generated"
      );

      const outputs = (genData.outputs ?? []) as GeneratedOutput[];

      updateStepStatus(
        4,
        "running",
        language === "id"
          ? "Menempel produk asli, bayangan alami, dan verifikasi kualitas"
          : "Compositing product, shadows, and auditing quality"
      );
      setCurrentLogMessage(
        language === "id"
          ? "Mengecek kesesuaian hasil foto dengan produk asli..."
          : "Verifying output photo against original product..."
      );

      const auditedOutputs = await Promise.all(
        outputs.map(
          async (output: GeneratedOutput): Promise<GeneratedOutput> => {
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
                const valData = (await valRes.json()) as {
                  validation?: ValidationResult;
                };
                if (valData.validation) {
                  return {
                    ...output,
                    consistencyScore: valData.validation.score,
                    validation: valData.validation,
                    status:
                      valData.validation.status === "needs_regeneration"
                        ? ("rejected" as const)
                        : ("passed" as const),
                  };
                }
              }
            } catch (valErr: unknown) {
              if (valErr instanceof Error && valErr.name === "AbortError")
                throw valErr;
              console.warn(
                "Validation route request error, retaining fallback:",
                valErr
              );
            }

            return output;
          }
        )
      );

      setGeneratedOutputs(auditedOutputs);
      setSelectedOutputIndex(0);
      updateStepStatus(
        4,
        "completed",
        language === "id"
          ? `${auditedOutputs.length} foto komersial siap digunakan`
          : `${auditedOutputs.length} commercial photos ready`
      );
      setCurrentLogMessage(
        language === "id"
          ? "Selesai! Foto produk komersial siap digunakan."
          : "Complete! Commercial product photos ready."
      );

      const scoredOutputs = auditedOutputs.filter(
        (o) => o.consistencyScore !== null
      );
      const avgScore =
        scoredOutputs.length > 0
          ? Math.round(
              scoredOutputs.reduce(
                (acc, curr) => acc + (curr.consistencyScore ?? 0),
                0
              ) / scoredOutputs.length
            )
          : 0;

      const historyItem: GenerationHistoryItem = {
        id: `session-${Date.now()}`,
        projectName:
          currentBlueprint.subcategory || `${category} Studio Shoot`,
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
      const msg =
        err instanceof Error
          ? err.message
          : language === "id"
          ? "Pemrosesan foto gagal. Silakan coba lagi."
          : "Pipeline execution failed. Please try again.";
      setErrorMessage(msg);
      setCurrentLogMessage(`ERROR: ${msg}`);

      setPipelineSteps((prev) =>
        prev.map((step) =>
          step.status === "running"
            ? { ...step, status: "failed", error: msg }
            : step
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
      const cleanName =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "foto-produk";
      a.download = `studio-${cleanName}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleShare = async (url: string, title: string) => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        if (url.startsWith("data:")) {
          const res = await fetch(url);
          const blob = await res.blob();
          const file = new File([blob], `${title}.png`, { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title,
              files: [file],
            });
            return;
          }
        }
        await navigator.share({
          title,
          text: `VELLUM Commercial Studio Shoot: ${title}`,
          url: url.startsWith("http") ? url : undefined,
        });
        return;
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") return;
        // Fallback to download
      }
    }
    // Fallback: download
    handleDownloadSingle(url, title, "png");
  };

  const activeOutput: GeneratedOutput | undefined =
    generatedOutputs[selectedOutputIndex] || generatedOutputs[0];
  const primarySourceImage = sourceImages[0];

  return {
    // Assets
    sourceImages,
    setSourceImages,
    referenceImages,
    setReferenceImages,
    primarySourceImage,

    // Spec & Direction
    category,
    setCategory,
    locks,
    setLocks,
    direction,
    setDirection,
    preservation,
    generationCount,
    setGenerationCount,

    // UI Expand / Collapse
    isAdvancedOpen,
    setIsAdvancedOpen,
    isRightSidebarOpen,
    setIsRightSidebarOpen,

    // Pipeline Execution
    isGenerating,
    hasStarted,
    pipelineSteps,
    currentLogMessage,
    blueprint,
    generatedOutputs,
    selectedOutputIndex,
    setSelectedOutputIndex,
    activeOutput,

    // Modals & Panels
    isBlueprintModalOpen,
    setIsBlueprintModalOpen,
    isHistoryDrawerOpen,
    setIsHistoryDrawerOpen,
    isConceptArtOpen,
    setIsConceptArtOpen,

    // Status / Quota
    demoRemaining,
    quotaExceededNotice,
    setQuotaExceededNotice,
    errorMessage,
    setErrorMessage,

    // History
    historyItems,
    saveToHistory,
    handleLoadHistoryItem,
    handleDeleteHistoryItem,

    // Handlers
    handleLoadDemoProduct,
    handleRunAgent,
    handleDownloadSingle,
    handleShare,
    updateStepStatus,

    // i18n
    t,
    language,
  };
}

export type StudioSession = ReturnType<typeof useStudioSession>;
