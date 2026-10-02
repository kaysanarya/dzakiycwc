import {
  AIProvider,
  AnalyzeProductInput,
  AnalyzeReferenceInput,
  GenerateImagesInput,
  ValidateConsistencyInput,
} from "./provider";
import {
  ProductBlueprint,
  ReferenceAnalysis,
  GeneratedOutput,
  ValidationResult,
  CameraAngle,
} from "@/types";
import { buildStructuredPrompt } from "@/lib/prompts/buildPrompt";
import { generateInpaintingMask, prepareImageBuffer, toSafeDataUri } from "./removeBackground";
import { AiPipelineError } from "./AiPipelineError";
import { DemoAIProvider } from "./demoProvider";
import { sanitizeErrorMessage } from "@/lib/auth/serverAuth";

export class ReplicateAIProvider implements AIProvider {
  name = "Replicate (Inpainting / SDXL / Flux)";
  isDemo = false;
  private apiKey: string;
  private demoFallback = new DemoAIProvider();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeProduct(input: AnalyzeProductInput): Promise<ProductBlueprint> {
    return this.demoFallback.analyzeProduct(input);
  }

  async analyzeReference(input: AnalyzeReferenceInput): Promise<ReferenceAnalysis> {
    return this.demoFallback.analyzeReference(input);
  }

  async generateProductImages(
    input: GenerateImagesInput,
    signal?: AbortSignal
  ): Promise<GeneratedOutput[]> {
    const { blueprint, locks, direction, preservation, referenceAnalysis, count } = input;

    const isExplicitAngle = direction.cameraAngle && direction.cameraAngle !== "copy_reference";
    const angleVariations = [
      "hero three-quarter perspective studio shot",
      "straight-on front profile commercial catalog view",
      "dramatic dynamic low-angle hero elevation",
      "overhead 45-degree top-down editorial flatlay",
    ];

    const generateSingleImage = async (index: number): Promise<GeneratedOutput> => {
      // Respect user-selected camera angle if explicitly set
      const angleName = isExplicitAngle
        ? direction.cameraAngle
        : angleVariations[index % angleVariations.length];

      const { generationPrompt, negativePrompt, diffusionParams } = buildStructuredPrompt({
        blueprint,
        locks,
        direction: { ...direction, cameraAngle: (isExplicitAngle ? direction.cameraAngle : angleName) as CameraAngle },
        preservation,
        referenceAnalysis,
        variationIndex: index,
      });

      let imageUrl: string | undefined;
      let usedMethod = "unknown";
      let isDegraded = false;

      // 1. Try SDXL Inpainting with binary mask
      if (input.sourceImages && input.sourceImages.length > 0) {
        try {
          const rawBase64 = input.sourceImages[0].dataUrl.includes(",")
            ? input.sourceImages[0].dataUrl.split(",")[1]
            : input.sourceImages[0].dataUrl;
          const rawBuf = Buffer.from(rawBase64, "base64");

          // forcePng → resize if needed → generate mask from SAME final buffer
          const { imageBuffer, width, height } = await prepareImageBuffer(rawBuf);
          const maskBuf = await generateInpaintingMask(imageBuffer, width, height);
          const imageDataUri = toSafeDataUri(imageBuffer);
          const maskDataUri = toSafeDataUri(maskBuf);

          const imgRes = await fetch("https://api.replicate.com/v1/models/stability-ai/sdxl/predictions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              "Content-Type": "application/json",
              Prefer: "wait",
            },
            signal: signal ?? AbortSignal.timeout(90_000),
            body: JSON.stringify({
              input: {
                image: imageDataUri,
                mask: maskDataUri,
                prompt: generationPrompt,
                negative_prompt: negativePrompt,
                prompt_strength: diffusionParams.denoisingStrength,
                guidance_scale: diffusionParams.guidanceScale,
                refine: "expert_ensemble_refiner",
                apply_watermark: false,
              },
            }),
          });

          if (imgRes.ok) {
            const imgData = await imgRes.json();
            if (Array.isArray(imgData.output) && imgData.output.length > 0) {
              imageUrl = imgData.output[0];
            } else if (typeof imgData.output === "string") {
              imageUrl = imgData.output;
            } else if (imgData.urls?.get) {
              imageUrl = await this.pollPrediction(imgData.urls.get, signal);
            }
            if (imageUrl) {
              usedMethod = "replicate-sdxl-inpaint";
              isDegraded = false;
            }
          } else {
            const errText = await imgRes.text().catch(() => "");
            const sanitized = sanitizeErrorMessage(new Error(errText), [this.apiKey]).slice(0, 300);
            console.error(`[replicate] SDXL inpaint HTTP ${imgRes.status}: ${sanitized}`);
          }
        } catch (sdxlErr) {
          if (sdxlErr instanceof AiPipelineError) throw sdxlErr; // mask/bg errors propagate
          const msg = sanitizeErrorMessage(sdxlErr, [this.apiKey]).slice(0, 300);
          console.error(`[replicate] SDXL exception: ${msg}`);
        }
      }

      // 2. Fallback to Flux Schnell text-to-image
      if (!imageUrl) {
        const res = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            Prefer: "wait",
          },
          signal: signal ?? AbortSignal.timeout(90_000),
          body: JSON.stringify({
            input: {
              prompt: generationPrompt,
              aspect_ratio: direction.aspectRatio === "9:16" ? "9:16" : direction.aspectRatio === "16:9" ? "16:9" : "1:1",
              output_format: "webp",
              output_quality: 90,
            },
          }),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          const sanitized = sanitizeErrorMessage(new Error(errText), [this.apiKey]).slice(0, 300);
          throw new AiPipelineError(
            `Replicate Flux Schnell failed: ${sanitized}`,
            "provider",
            { provider: "replicate", status: res.status }
          );
        }

        const data = await res.json();
        if (Array.isArray(data.output) && data.output.length > 0) {
          imageUrl = data.output[0];
        } else if (typeof data.output === "string") {
          imageUrl = data.output;
        } else if (data.urls?.get) {
          imageUrl = await this.pollPrediction(data.urls.get, signal);
        }
        if (imageUrl) {
          usedMethod = "replicate-flux";
          isDegraded = true;
        }
      }

      if (!imageUrl) {
        throw new AiPipelineError(
          "Replicate model prediction timed out or did not return an image URL.",
          "provider",
          { provider: "replicate" }
        );
      }

      return {
        id: `replicate-${Date.now()}-${index}`,
        imageUrl,
        prompt: generationPrompt,
        angle: angleName,
        consistencyScore: null,
        validation: {
          score: null,
          checks: {},
          status: "unverified",
          notes: [
            "Visual consistency check skipped: Replicate FLUX model is generation-only and does not support multimodal self-audit. Independent validation available at Step 6.",
          ],
          isFallback: true,
          validatedAt: new Date().toISOString(),
        },
        status: "passed",
        createdAt: new Date().toISOString(),
        aspectRatio: direction.aspectRatio,
        degraded: isDegraded,
        method: usedMethod,
      };
    };

    const targetCount = Math.min(Math.max(1, count), 8);
    const promises: (() => Promise<GeneratedOutput>)[] = [];
    for (let i = 0; i < targetCount; i++) {
      const idx = i;
      promises.push(() => generateSingleImage(idx));
    }

    // Concurrency-limited Promise.allSettled (max 3 in-flight at a time)
    const CONCURRENCY = 3;
    const settled: PromiseSettledResult<GeneratedOutput>[] = [];
    for (let i = 0; i < promises.length; i += CONCURRENCY) {
      const batch = promises.slice(i, i + CONCURRENCY).map((fn) => fn());
      const batchResults = await Promise.allSettled(batch);
      settled.push(...batchResults);
    }

    const successfulOutputs: GeneratedOutput[] = [];
    settled.forEach((r, idx) => {
      if (r.status === "fulfilled") {
        successfulOutputs.push(r.value);
      } else {
        const sanitized = sanitizeErrorMessage(r.reason, [this.apiKey]).slice(0, 300);
        console.error(`[replicate] Generation failed for index ${idx}: stage=${r.reason instanceof AiPipelineError ? r.reason.stage : "unknown"} msg=${sanitized}`);
      }
    });

    if (successfulOutputs.length === 0) {
      const firstRejected = settled.find((r) => r.status === "rejected") as PromiseRejectedResult;
      const reason = firstRejected?.reason;
      if (reason instanceof AiPipelineError) throw reason;
      throw new AiPipelineError(
        sanitizeErrorMessage(reason, [this.apiKey]).slice(0, 300) || "Failed to generate images with Replicate.",
        "provider",
        { provider: "replicate" }
      );
    }

    return successfulOutputs;
  }

  async validateProductConsistency(input: ValidateConsistencyInput): Promise<ValidationResult> {
    return {
      score: null,
      checks: {},
      status: "unverified",
      notes: [
        "Visual consistency check skipped: Replicate FLUX model is generation-only and does not support multimodal self-audit.",
      ],
      isFallback: true,
      validatedAt: new Date().toISOString(),
    };
  }

  private async pollPrediction(getUrl: string, signal?: AbortSignal): Promise<string | undefined> {
    let attempts = 0;
    while (attempts < 15) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(getUrl, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: signal ?? AbortSignal.timeout(15_000),
      });
      if (pollRes.ok) {
        const pollData = await pollRes.json();
        if (pollData.status === "succeeded") {
          return Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
        } else if (pollData.status === "failed") {
          const sanitized = sanitizeErrorMessage(
            new Error(pollData.error || "Prediction failed"),
            [this.apiKey]
          ).slice(0, 300);
          throw new AiPipelineError(
            `Replicate prediction failed: ${sanitized}`,
            "provider",
            { provider: "replicate" }
          );
        }
      }
      attempts++;
    }
    return undefined;
  }
}
