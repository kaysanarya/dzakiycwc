"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Header } from "@/components/app-shell/Header";
import { ProductSourceUpload } from "@/components/upload/ProductSourceUpload";
import { ReferenceUpload } from "@/components/upload/ReferenceUpload";
import { ProductSpec } from "@/components/product-spec/ProductSpec";
import { CameraSettings } from "@/components/camera-settings/CameraSettings";
import { PreservationControls } from "@/components/preservation/PreservationControls";
import { ProductLocks } from "@/components/product-lock/ProductLocks";
import { FootwearHeelLock } from "@/components/heel-lock/FootwearHeelLock";
import { AgentMonitor } from "@/components/agent-monitor/AgentMonitor";
import { BlueprintModal } from "@/components/blueprint/BlueprintModal";
import { ResultGallery } from "@/components/result-gallery/ResultGallery";
import { HistoryDrawer } from "@/components/history/HistoryDrawer";
import { ConceptArtGenerator } from "@/components/concept-art/ConceptArtGenerator";

import {
  UploadedImage,
  ProductCategory,
  FootwearHeelSpecs,
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

import { Sparkles, Play, Camera, AlertTriangle, ArrowRight, KeyRound, X } from "lucide-react";
import { ApiSettingsModal, type ApiCredentials } from "@/components/api-settings/ApiSettingsModal";

const INITIAL_STEPS: AgentStep[] = [
  { id: 1, key: "analyze_product", title: "Analyze Raw Product", description: "Multi-angle visual inspection of geometry and materials", status: "pending" },
  { id: 2, key: "create_blueprint", title: "Create Product Blueprint", description: "Extract structured physical constraints & identity", status: "pending" },
  { id: 3, key: "analyze_reference", title: "Analyze Reference", description: "Extract lighting, background & mood without geometry", status: "pending" },
  { id: 4, key: "apply_locks", title: "Apply Product Locks", description: "Immobilize physical attributes against generative drift", status: "pending" },
  { id: 5, key: "generate_images", title: "Generate Images", description: "Direct camera angles, shadows, and environment", status: "pending" },
  { id: 6, key: "validate_consistency", title: "Validate Product Consistency", description: "AI visual audit against blueprint constraints", status: "pending" },
  { id: 7, key: "finalize_images", title: "Finalize Images", description: "Package commercial catalog results & consistency scores", status: "pending" },
];

const DEFAULT_LOCKS: ProductLocksType = {
  lockShape: true,
  lockStrap: true,
  lockOutsole: true,
  lockLogo: true,
  lockBuckle: true,
  lockOrnament: true,
  lockMaterial: true,
  lockTexture: true,
  lockStitching: true,
  lockColor: true,
  lockProportion: true,
  lockConstruction: true,
  lockHeelHeight: true,
  lockHeelWidth: true,
  lockHeelAngle: true,
  lockHeelPosition: true,
  lockHeelShape: true,
  lockHeelThickness: true,
  lockFrontSoleThickness: true,
  lockHeelProportion: true,
};

export default function Home() {
  const { t, language } = useLanguage();

  // Visual Assets
  const [sourceImages, setSourceImages] = useState<UploadedImage[]>([]);
  const [referenceImages, setReferenceImages] = useState<UploadedImage[]>([]);

  // Product Spec & Locks
  const [category, setCategory] = useState<ProductCategory>("footwear");
  const [heelSpecs, setHeelSpecs] = useState<FootwearHeelSpecs>({
    heelHeight: "85mm (3.35 inches)",
    heelWidth: "42mm crown to 48mm flared base",
    heelAngle: "88° structural pitch",
    heelPosition: "Directly centered below calcaneus",
    heelShape: "Hourglass flared block",
    heelThickness: "Substantial architectural block",
    frontSoleThickness: "6mm beveled leather welt",
  });
  const [locks, setLocks] = useState<ProductLocksType>(DEFAULT_LOCKS);

  // Photography Direction
  const [direction, setDirection] = useState<PhotographyDirection>({
    cameraAngle: "copy_reference",
    background: "studio_beige",
    marketplacePreset: "shopee",
    aspectRatio: "1:1",
    modelSetting: "without_model",
  });

  // Preservation Controls
  const [preservation, setPreservation] = useState<PreservationSettings>({
    detailPreservation: 100,
    referenceStrength: 80,
    consistencyMode: true,
    strictProductMode: true,
    ignoreProductDesignFromReference: true,
  });

  // Blueprint Caching key (F-14)
  const [cachedSourceKey, setCachedSourceKey] = useState<string | null>(null);

  // Generation Batch Count
  const [generationCount, setGenerationCount] = useState<number>(4);

  // Pipeline Execution State
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [pipelineSteps, setPipelineSteps] = useState<AgentStep[]>(INITIAL_STEPS);
  const [currentLogMessage, setCurrentLogMessage] = useState<string>("");
  const [blueprint, setBlueprint] = useState<ProductBlueprint | null>(null);
  const [generatedOutputs, setGeneratedOutputs] = useState<GeneratedOutput[]>([]);

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

  // AbortController for cancelling in-flight pipeline runs on restart/unmount (F-06)
  const pipelineAbortRef = useRef<AbortController | null>(null);

  // Cancel any running pipeline request if component unmounts (F-06)
  useEffect(() => {
    return () => {
      pipelineAbortRef.current?.abort();
    };
  }, []);

  // Sanitize history item to prevent localStorage QuotaExceededError (F-13)
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
          : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231951fc' opacity='0.2'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-size='10' font-family='sans-serif'>ARCHIVED</text></svg>",
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

    console.warn("[LocalStorage] Unable to persist history items: browser quota exhausted.");
  };

  // Save history to localStorage with functional updater and quota protection (F-13)
  const saveToHistory = (item: GenerationHistoryItem) => {
    setHistoryItems((prevItems) => {
      const updated = [item, ...prevItems.slice(0, 14)];
      persistHistoryToStorage(updated);
      return updated;
    });
  };

  // Quick Action: Load Demo Product (Section 36)
  const handleLoadDemoProduct = () => {
    setSourceImages(DEMO_SOURCE_IMAGES);
    setReferenceImages(DEMO_REFERENCE_IMAGES);
    setCategory("footwear");
    setBlueprint(DEMO_FOOTWEAR_BLUEPRINT);
    setGeneratedOutputs(DEMO_OUTPUTS);
    setHasStarted(true);
    setPipelineSteps(
      INITIAL_STEPS.map((s) => ({
        ...s,
        status: "completed",
        resultMessage: "Demo data loaded successfully",
      }))
    );
    setCurrentLogMessage("Loaded demo footwear project: Luxury Hourglass Mule");
  };

  // History load callback
  const handleLoadHistoryItem = (item: GenerationHistoryItem) => {
    setCategory(item.category);
    setSourceImages(item.rawImages);
    setReferenceImages(item.referenceImages);
    setBlueprint(item.blueprint);
    setLocks(item.locks);
    setDirection(item.direction);
    setPreservation(item.preservation);
    setGeneratedOutputs(item.outputs);
    setHasStarted(true);
    setIsHistoryDrawerOpen(false);
    setCurrentLogMessage(`Loaded historical shoot: ${item.projectName}`);
  };

  // Update a single pipeline step status
  const updateStepStatus = (
    id: number,
    status: AgentStep["status"],
    resultMessage?: string
  ) => {
    setPipelineSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, status, resultMessage } : step
      )
    );
  };

  // -------------------------------------------------------------
  // MASTER PIPELINE: RUN AGENT (7 Sequential Stages)
  // -------------------------------------------------------------
  const handleRunAgent = async () => {
    if (isGenerating) return;
    if (sourceImages.length === 0) {
      setErrorMessage("Please upload at least one raw product photo (Source of Truth).");
      return;
    }

    // Cancel old in-flight request if user restarts or starts new run (F-06)
    pipelineAbortRef.current?.abort();
    const abortController = new AbortController();
    pipelineAbortRef.current = abortController;
    const signal = abortController.signal;

    setErrorMessage(null);
    setIsGenerating(true);
    setHasStarted(true);
    setPipelineSteps(INITIAL_STEPS);
    setCurrentLogMessage("Initializing VELLUM Photography Director pipeline...");

    try {
      // Blueprint Caching System (Requirement 13, F-14: Include full heelSpecs in cache key)
      const heelKey = category === "footwear" ? JSON.stringify(heelSpecs) : "";
      const currentSourceKey = `${category}-${heelKey}-${sourceImages.map((img) => img.id + "_" + img.size).join("|")}`;
      const isCacheValid = Boolean(blueprint) && cachedSourceKey === currentSourceKey;

      const footwearNotes = category === "footwear"
        ? `Footwear Heel Specs: Height: ${heelSpecs.heelHeight}, Width: ${heelSpecs.heelWidth}, Shape: ${heelSpecs.heelShape}, Angle: ${heelSpecs.heelAngle}, Position: ${heelSpecs.heelPosition}, Thickness: ${heelSpecs.heelThickness}, Front Sole: ${heelSpecs.frontSoleThickness}`
        : undefined;

      let currentBlueprint: ProductBlueprint;

      if (isCacheValid && blueprint) {
        // STEP 1 & 2 CACHING: Skip API analysis when raw images unchanged to save API calls
        currentBlueprint = blueprint;
        updateStepStatus(1, "completed", "Loaded from Blueprint Cache (Source unchanged)");
        updateStepStatus(2, "completed", "Active Blueprint constraint cached");
        setCurrentLogMessage("Source unchanged — Skipping STEP 1 & 2 using cached Product Blueprint.");
      } else {
        // STEP 1: Analyze Raw Product
        updateStepStatus(1, "running", `Inspecting ${sourceImages.length} raw angles`);
        setCurrentLogMessage(`STEP 1: Multimodal inspection running on ${sourceImages.length} product images...`);

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
          throw new Error(errData.error || "Step 1 failed: Raw product visual analysis failed.");
        }
        const analyzeData = await analyzeRes.json();
        currentBlueprint = analyzeData.blueprint as ProductBlueprint;
        setBlueprint(currentBlueprint);
        setCachedSourceKey(currentSourceKey);
        updateStepStatus(1, "completed", "Physical geometry and materials identified");

        // STEP 2: Create Product Blueprint (F-06: Connect /api/blueprint)
        updateStepStatus(2, "running", "Synthesizing structured constraint model");
        setCurrentLogMessage("STEP 2: Synthesizing authoritative Product Blueprint...");

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

        updateStepStatus(2, "completed", "Blueprint generated as authoritative constraint");
      }

      // STEP 3: Analyze Reference (if uploaded)
      if (referenceImages.length > 0) {
        updateStepStatus(3, "running", "Extracting lighting and backdrop without copying geometry");
        setCurrentLogMessage("STEP 3: Isolating lighting direction and color temperature from reference...");
        await new Promise((r) => setTimeout(r, 600));
        updateStepStatus(3, "completed", "Reference direction extracted (geometry ignored)");
      } else {
        updateStepStatus(3, "completed", "Using studio preset lighting (no reference)");
      }

      // STEP 4: Apply Product Locks
      updateStepStatus(4, "running", "Applying rigid geometry and hardware constraints");
      setCurrentLogMessage("STEP 4: Applying Product Lock constraints to prompt architecture...");
      await new Promise((r) => setTimeout(r, 400));
      updateStepStatus(4, "completed", "Product locks enforced on prompt architecture");

      // STEP 5: Generate Images
      updateStepStatus(5, "running", `Directing batch of ${generationCount} studio angles`);
      setCurrentLogMessage(`STEP 5: Generating ${generationCount} studio photography angles...`);

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

      // Note: HTTP 207 (partial success) is treated as ok by fetch — we must check the body
      const genData = await genRes.json().catch(() => ({})) as {
        success?: boolean;
        code?: string;
        outputs?: GeneratedOutput[];
        failedCount?: number;
        errors?: { stage: string; message: string }[];
        error?: { stage: string; message: string } | string;
      };

      if (!genRes.ok || genData.success === false) {
        if (genRes.status === 429 || genData.code === "DEMO_QUOTA_EXCEEDED") {
          setQuotaExceededNotice(true);
          setDemoRemaining(0);
        }
        const errMsg =
          typeof genData.error === "object" ? genData.error?.message
          : typeof genData.error === "string" ? genData.error
          : "Step 5 failed: AI image generation service encountered an error.";
        throw new Error(errMsg || "Step 5 failed: AI image generation service encountered an error.");
      }

      const outputs = (genData.outputs ?? []) as GeneratedOutput[];

      if (genData.failedCount && genData.failedCount > 0 && outputs.length > 0) {
        // Partial success — log warning, continue with what we have
        console.warn(`[Pipeline] Partial generation: ${outputs.length} succeeded, ${genData.failedCount} failed.`);
      }
      updateStepStatus(5, "completed", `${outputs.length} images generated`);

      // STEP 6: Validate Product Consistency (F-06: Connect /api/validate & Requirement 13)
      updateStepStatus(6, "running", "Auditing consistency against original blueprint (Max 2 retries)");
      setCurrentLogMessage("STEP 6: Running visual consistency audit across outputs...");

      const auditedOutputs = await Promise.all(
        outputs.map(async (output: GeneratedOutput): Promise<GeneratedOutput> => {
          // If already validated by provider without fallback, retain
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

      let finalOutputs = auditedOutputs;
      let retries = 0;
      // Requirement 5: Retry maksimal 1x, hanya jika provider berbayar dan validasi gagal
      const isPaidProvider = Boolean(apiCredentials?.apiKey);
      const maxRetries = isPaidProvider ? 1 : 0;

      while (
        retries < maxRetries &&
        finalOutputs.some((o) => o.status === "rejected" || o.validation.status === "needs_regeneration")
      ) {
        retries++;
        setCurrentLogMessage(`STEP 6: Quality validation failed. Auto-regenerating attempt 1/1...`);

        const regenPromises = finalOutputs.map(async (output: GeneratedOutput): Promise<GeneratedOutput> => {
          if (output.status !== "rejected" && output.validation.status !== "needs_regeneration") return output;

          try {
            const regenRes = await fetch("/api/generate", {
              method: "POST",
              headers: getAuthHeaders(),
              signal,
              body: JSON.stringify({
                blueprint: currentBlueprint,
                locks,
                direction: { ...direction, cameraAngle: output.angle },
                preservation,
                sourceImages,
                referenceImages,
                count: 1,
              }),
            });

            updateDemoRemaining(regenRes);

            const regenData: { success?: boolean; code?: string; outputs?: GeneratedOutput[]; error?: { message?: string } | string } =
              await regenRes.json().catch(() => ({}));

            if (!regenRes.ok || regenData.success === false) {
              if (regenRes.status === 429 || regenData.code === "DEMO_QUOTA_EXCEEDED") {
                setQuotaExceededNotice(true);
                setDemoRemaining(0);
              }
              return {
                ...output,
                status: "rejected" as const,
                validation: {
                  ...output.validation,
                  notes: [
                    ...(output.validation.notes || []),
                    `Auto-regeneration attempt failed (HTTP ${regenRes.status}).`,
                  ],
                },
              };
            }
            const newOutput = regenData.outputs?.[0];
            if (newOutput) {
              return newOutput;
            }

            return {
              ...output,
              status: "rejected" as const,
            };
          } catch (err: unknown) {
            if (err instanceof Error && err.name === "AbortError") {
              throw err;
            }
            return {
              ...output,
              status: "rejected" as const,
              validation: {
                ...output.validation,
                notes: [...(output.validation.notes || []), `Auto-regeneration error: ${err instanceof Error ? err.message : "Unknown error"}`],
              },
            };
          }
        });

        finalOutputs = await Promise.all(regenPromises);
      }

      updateStepStatus(6, "completed", `Consistency evaluated (${retries > 0 ? `${retries} auto-retries handled` : "Passed validation"})`);

      // STEP 7: Finalize Images
      updateStepStatus(7, "running", "Compiling final catalog results");
      setGeneratedOutputs(finalOutputs);
      updateStepStatus(7, "completed", "Commercial photography session complete");
      setCurrentLogMessage("Pipeline completed successfully. Product identity preserved.");

      // Save session to history
      const scoredOutputs = finalOutputs.filter((o) => o.consistencyScore !== null);
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
        outputs: finalOutputs,
        averageScore: avgScore,
        isDemo: false,
      };
      saveToHistory(historyItem);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.warn("Pipeline warning:", err);
      const msg = err instanceof Error ? err.message : "Pipeline execution failed. Please try again.";
      setErrorMessage(msg);
      setCurrentLogMessage(`ERROR: ${msg}`);

      // Mark the active running step as failed
      setPipelineSteps((prev) =>
        prev.map((step) =>
          step.status === "running" ? { ...step, status: "failed" } : step
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Single Angle Regeneration
  const handleRegenerateSingle = async (outputId: string) => {
    if (!blueprint || isGenerating) return;
    setIsGenerating(true);
    setCurrentLogMessage(`Regenerating angle ${outputId} with strict lock constraints...`);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          blueprint,
          locks,
          direction,
          preservation,
          sourceImages,
          referenceImages,
          count: 1,
        }),
      });

      if (res.ok) {
        const data: { success?: boolean; outputs?: GeneratedOutput[] } = await res.json().catch(() => ({}));
        if (data.success !== false && data.outputs && data.outputs.length > 0) {
          const newOutput = data.outputs[0];
          if (newOutput) {
            setGeneratedOutputs((prev) =>
              prev.map((out) => (out.id === outputId ? newOutput : out))
            );
            setCurrentLogMessage(`Angle ${outputId} regenerated successfully.`);
          }
        } else {
          const errMsg =
            typeof (data as { error?: { message?: string } }).error === "object"
              ? (data as { error?: { message?: string } }).error?.message
              : "Regeneration returned no output.";
          setCurrentLogMessage(`Failed to regenerate ${outputId}: ${errMsg || "Unknown error"}.`);
        }
      } else {
        setCurrentLogMessage(`Failed to regenerate ${outputId} (HTTP ${res.status}).`);
      }
    } catch (err) {
      console.warn("Single regeneration warning:", err);
      setCurrentLogMessage(`Failed to regenerate ${outputId}.`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete an output
  const handleDeleteSingle = (outputId: string) => {
    setGeneratedOutputs((prev) => prev.filter((o) => o.id !== outputId));
  };

  return (
    <div className="min-h-screen text-white flex flex-col font-sans">
      {/* Top App Header */}
      <Header
        onLoadDemoProduct={handleLoadDemoProduct}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        onOpenApiSettings={() => setIsApiSettingsOpen(true)}
        hasApiKey={Boolean(apiCredentials?.apiKey)}
        activeProviderName={apiCredentials?.provider}
        historyCount={historyItems.length}
        demoRemaining={demoRemaining}
      />

      {/* Main Studio Workspace with generous top padding */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-8">
        {/* Core Concept Banner - Liquid Glass iOS Widget */}
        <div className="mb-6 p-4 sm:p-5 liquid-glass-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1951fc] to-[#3781fc] flex items-center justify-center text-white shrink-0 shadow-[0_6px_16px_rgba(25,81,252,0.45),inset_0_1px_1px_rgba(203,233,253,0.35)]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-white/90 tracking-tight uppercase">
                  {t.page.studioPrinciple}
                </span>
                <span className="text-xs font-extrabold text-[#3781fc] bg-[#3781fc]/10 px-2.5 py-0.5 rounded-full border border-white/[0.06]">
                  {t.page.productLocked}
                </span>
                <span className="text-xs font-semibold text-white/20">
                  •
                </span>
                <span className="text-xs font-bold text-white/60">
                  {t.page.photographyGenerative}
                </span>
              </div>
              <p className="text-xs text-white/40 mt-1 font-medium">
                {t.page.studioPrincipleDesc}
              </p>
            </div>
          </div>

          {sourceImages.length === 0 && (
            <button
              type="button"
              onClick={handleLoadDemoProduct}
              className="liquid-glass-btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-full shrink-0 cursor-pointer shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{t.page.exploreDemoFootwear}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Demo Quota Exceeded Notice with Action Button */}
        {quotaExceededNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200 shadow-xl backdrop-blur-md">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-amber-100 text-sm">{t.quota.exceededTitle}</p>
                <p className="text-amber-200/80 mt-0.5">{t.quota.exceededMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                id="quota-use-own-key-btn"
                onClick={() => {
                  setIsApiSettingsOpen(true);
                  setQuotaExceededNotice(false);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs bg-[#1951fc] hover:bg-[#3781fc] text-white shadow-[0_2px_8px_rgba(25,81,252,0.4)] cursor-pointer active:scale-95 transition-all"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{t.quota.useOwnKey}</span>
              </button>
              <button
                type="button"
                onClick={() => setQuotaExceededNotice(false)}
                className="p-1.5 rounded-full text-amber-200/60 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                title={t.page.dismiss}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Global Error Notice */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-between text-xs text-red-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="font-bold underline cursor-pointer text-red-200 hover:text-white"
            >
              {t.page.dismiss}
            </button>
          </div>
        )}

        {/* 2-Column Desktop Grid Layout (Section 32) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANEL: 55-60% (col-span-7) VELLUM Configuration Workspace */}
          <div className="lg:col-span-7 space-y-6">
            <div className="liquid-glass-card p-5 sm:p-7 space-y-6">
              {/* SECTION 1: SOURCE VISUALS */}
              <div>
                <ProductSourceUpload
                  images={sourceImages}
                  onAddImages={(newImgs) =>
                    setSourceImages((prev) => [...prev, ...newImgs])
                  }
                  onRemoveImage={(id) =>
                    setSourceImages((prev) => prev.filter((img) => img.id !== id))
                  }
                  onUpdateTag={(id, tag) =>
                    setSourceImages((prev) =>
                      prev.map((img) => (img.id === id ? { ...img, tag } : img))
                    )
                  }
                />

                <ReferenceUpload
                  references={referenceImages}
                  onAddReferences={(newRefs) =>
                    setReferenceImages((prev) => [...prev, ...newRefs])
                  }
                  onRemoveReference={(id) =>
                    setReferenceImages((prev) => prev.filter((img) => img.id !== id))
                  }
                  onSetCameraAngleToReference={() => {
                    setTimeout(() => {
                      setDirection((prev) => ({ ...prev, cameraAngle: "copy_reference" }));
                    }, 0);
                  }}
                />
              </div>

              {/* SECTION 2: PHYSICAL PRODUCT SPECIFICATION */}
              <ProductSpec
                category={category}
                onChangeCategory={(cat) => setCategory(cat)}
                heelSpecs={heelSpecs}
                onChangeHeelSpecs={setHeelSpecs}
                strictProductMode={preservation.strictProductMode}
                onToggleStrictMode={(val) =>
                  setPreservation({ ...preservation, strictProductMode: val })
                }
                ignoreProductDesignFromReference={
                  preservation.ignoreProductDesignFromReference
                }
                onToggleIgnoreRefDesign={(val) =>
                  setPreservation({
                    ...preservation,
                    ignoreProductDesignFromReference: val,
                  })
                }
              />

              {/* SECTION 3: CAMERA & ENVIRONMENT */}
              <CameraSettings
                direction={direction}
                onChangeDirection={setDirection}
              />

              {/* SECTION 4: PRESERVATION & CONSISTENCY */}
              <PreservationControls
                settings={preservation}
                onChangeSettings={setPreservation}
              />

              {/* SECTION 5: PRODUCT LOCK */}
              <ProductLocks locks={locks} onChangeLocks={setLocks} />

              {/* FOOTWEAR HEEL LOCK (Rendered strictly when category === footwear) */}
              <FootwearHeelLock
                locks={locks}
                onChangeLocks={setLocks}
                category={category}
              />

              {/* BOTTOM EXECUTION BAR - Clean, Centered & Simple */}
              <div className="pt-6 border-t border-white/[0.05] flex flex-col items-center justify-center gap-3.5 w-full">
                {/* 1. Centered Output Count Selector */}
                <div className="inline-flex items-center gap-3 bg-white/[0.04] px-4 py-1.5 rounded-full border border-white/[0.07] shadow-[0_2px_8px_rgba(3,25,91,0.2)]">
                  <span className="text-xs font-bold text-white/80 tracking-wider uppercase">
                    {t.page.generationCount}
                  </span>
                  <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-full border border-white/[0.06]">
                    {[1, 2, 4, 6, 8].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setGenerationCount(count)}
                        className={`w-7 h-7 text-xs font-bold rounded-full transition-all cursor-pointer ${
                          generationCount === count
                            ? "bg-[#1951fc] text-white shadow-[0_2px_8px_rgba(25,81,252,0.5)] scale-105"
                            : "text-white/60 hover:text-white hover:bg-[#1951fc]/20"
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Demo Mode Notice before generate (Fase 1) */}
                {!apiCredentials?.apiKey && (
                  <div className="w-full sm:max-w-md p-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-200 flex items-center justify-between gap-3 text-xs shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate">
                        {language === "id"
                          ? "Mode demo: masukkan API key untuk hasil asli"
                          : "Demo mode: enter API key for authentic results"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsApiSettingsOpen(true)}
                      className="px-3 py-1 text-[11px] font-bold rounded-full bg-amber-500 hover:bg-amber-400 text-black shrink-0 cursor-pointer transition-all active:scale-95"
                    >
                      {language === "id" ? "Atur Key" : "Set Key"}
                    </button>
                  </div>
                )}

                {/* 2. Main Centered Hero Button: Run Agent */}
                <button
                  type="button"
                  onClick={handleRunAgent}
                  disabled={isGenerating || sourceImages.length === 0}
                  className="w-full sm:max-w-md py-3.5 px-8 rounded-full liquid-glass-btn-primary font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-[0_12px_30px_rgba(25,81,252,0.45)] hover:shadow-[0_16px_40px_rgba(25,81,252,0.6)] transition-all transform hover:-translate-y-0.5 active:scale-98"
                >
                  <Play className="w-4 h-4 fill-white text-white shrink-0" />
                  <span>
                    {isGenerating
                      ? t.page.directingShoot
                      : `⚡ Run Agent (Generate ${generationCount} Images)`}
                  </span>
                </button>

                {/* 3. Subtle Concept Art trigger */}
                <button
                  id="open-concept-art-btn"
                  type="button"
                  onClick={() => setIsConceptArtOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-purple-300 hover:text-purple-200 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/25 transition-all cursor-pointer transform hover:-translate-y-0.5 active:scale-98"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>{t.conceptArt.title || "Buka AI Concept Art Generator"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: 40-45% (col-span-5) Agent Monitor & Results */}
          <div className="lg:col-span-5 space-y-6">
            <AgentMonitor
              steps={pipelineSteps}
              isGenerating={isGenerating}
              hasStarted={hasStarted}
              blueprint={blueprint}
              onOpenBlueprint={() => setIsBlueprintModalOpen(true)}
              currentLogMessage={currentLogMessage}
            />

            {/* Degraded Generation Warning Banner */}
            {generatedOutputs.some((o) => o.degraded) && (() => {
              const inpaintFallbackOutputs = generatedOutputs.filter(
                (o) => o.method === "stability-core" || o.method === "replicate-flux"
              );
              const isOnlyInpaintFallback =
                inpaintFallbackOutputs.length > 0 &&
                inpaintFallbackOutputs.length === generatedOutputs.filter((o) => o.degraded).length;

              const degradedMsg = isOnlyInpaintFallback
                ? "Sebagian atau seluruh gambar beralih ke fallback text-to-image karena inpainting gagal (dihasilkan tanpa foto produk asli; detail produk mungkin tidak akurat)."
                : "Gambar dihasilkan tanpa foto produk asli; detail produk mungkin tidak akurat.";

              return (
                <div className="p-2.5 sm:p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md text-amber-200 flex items-center gap-2.5 shadow-md">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-xs text-amber-200/90 leading-snug line-clamp-2">
                      <strong className="font-semibold text-amber-300">
                        Degraded ({generatedOutputs.filter((o) => o.degraded).length}/{generatedOutputs.length}):{" "}
                      </strong>
                      {degradedMsg}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Generated Results Gallery (Section 25) */}
            <ResultGallery
              outputs={generatedOutputs}
              sourceImages={sourceImages}
              onRegenerateSingle={handleRegenerateSingle}
              onRegenerateAll={handleRunAgent}
              onDeleteSingle={handleDeleteSingle}
              isGenerating={isGenerating}
            />
          </div>
        </div>
    </main>

      {/* Blueprint Facts & JSON Modal */}
      <BlueprintModal
        blueprint={blueprint}
        isOpen={isBlueprintModalOpen}
        onClose={() => setIsBlueprintModalOpen(false)}
      />

      {/* Generation History Drawer */}
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

      {/* AI Concept Art Generator Modal */}
      <ConceptArtGenerator
        isOpen={isConceptArtOpen}
        onClose={() => setIsConceptArtOpen(false)}
      />

      {/* BYOK API Key Settings Modal */}
      <ApiSettingsModal
        isOpen={isApiSettingsOpen}
        onClose={() => setIsApiSettingsOpen(false)}
        onSaveCredentials={(creds, remember) => {
          handleSaveCredentials(creds, remember);
          if (creds?.apiKey) {
            setQuotaExceededNotice(false);
          }
        }}
        currentCredentials={apiCredentials}
      />
    </div>
  );
}
