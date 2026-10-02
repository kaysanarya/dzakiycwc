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
import { generateInpaintingMask, prepareImageBuffer } from "./removeBackground";
import { AiPipelineError } from "./AiPipelineError";
import { DemoAIProvider } from "./demoProvider";
import { sanitizeErrorMessage } from "@/lib/auth/serverAuth";

export class StabilityAIProvider implements AIProvider {
  name = "Stability AI (Inpainting / SD3 / Core)";
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

    // Stability aspect ratio mappings
    const supportedRatios = ["1:1", "16:9", "4:5", "9:16", "3:4"];
    const targetRatio = supportedRatios.includes(direction.aspectRatio)
      ? direction.aspectRatio
      : "1:1";

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

      let base64Image: string | undefined;
      let usedMethod = "unknown";
      let isDegraded = false;

      // 1. Try True Inpainting (Background Replacement around transparent product)
      if (input.sourceImages && input.sourceImages.length > 0) {
        try {
          const rawBase64 = input.sourceImages[0].dataUrl.includes(",")
            ? input.sourceImages[0].dataUrl.split(",")[1]
            : input.sourceImages[0].dataUrl;
          const rawBuf = Buffer.from(rawBase64, "base64");

          // Step: forcePng → resize if needed → THEN generate mask from final image
          const { imageBuffer, width, height } = await prepareImageBuffer(rawBuf);
          // Mask generated from the SAME (possibly resized) buffer so dimensions always match
          const maskBuffer = await generateInpaintingMask(imageBuffer, width, height);

          const inpaintFormData = new FormData();
          inpaintFormData.append("prompt", generationPrompt.slice(0, 1000));
          inpaintFormData.append("negative_prompt", negativePrompt.slice(0, 500));
          // Always send image/png regardless of original upload MIME type
          inpaintFormData.append("image", new Blob([new Uint8Array(imageBuffer)], { type: "image/png" }), "product.png");
          inpaintFormData.append("mask", new Blob([new Uint8Array(maskBuffer)], { type: "image/png" }), "mask.png");
          inpaintFormData.append("output_format", "png");

          const inpaintRes = await fetch("https://api.stability.ai/v2beta/stable-image/edit/inpaint", {
            method: "POST",
            headers: {
              authorization: `Bearer ${this.apiKey}`,
              accept: "application/json",
            },
            signal: signal ?? AbortSignal.timeout(90_000),
            body: inpaintFormData,
          });

          if (inpaintRes.ok) {
            const inpaintData = await inpaintRes.json();
            base64Image = inpaintData.image;
            usedMethod = "stability-inpaint";
            isDegraded = false;
          } else {
            const errText = await inpaintRes.text().catch(() => "");
            const sanitized = sanitizeErrorMessage(
              new Error(errText),
              [this.apiKey]
            ).slice(0, 300);
            console.error(`[stability] Inpaint HTTP ${inpaintRes.status}: ${sanitized}`);
          }
        } catch (inpaintErr) {
          if (inpaintErr instanceof AiPipelineError) throw inpaintErr; // mask/bg errors propagate
          const msg = sanitizeErrorMessage(inpaintErr, [this.apiKey]).slice(0, 300);
          console.error(`[stability] Inpaint exception: ${msg}`);
        }
      }

      // 2. Try SD3 Image-to-Image with diffusion denoising strength (0.65 - 0.80)
      if (!base64Image && input.sourceImages && input.sourceImages.length > 0) {
        try {
          const rawBase64 = input.sourceImages[0].dataUrl.includes(",")
            ? input.sourceImages[0].dataUrl.split(",")[1]
            : input.sourceImages[0].dataUrl;
          const { imageBuffer } = await prepareImageBuffer(Buffer.from(rawBase64, "base64"));
          const blob = new Blob([new Uint8Array(imageBuffer)], { type: "image/png" });

          const sd3FormData = new FormData();
          sd3FormData.append("prompt", generationPrompt.slice(0, 1000));
          sd3FormData.append("negative_prompt", negativePrompt.slice(0, 500));
          sd3FormData.append("image", blob, "source.png");
          sd3FormData.append("mode", "image-to-image");
          // Scaled diffusion denoising strength (0.65 - 0.80)
          sd3FormData.append("strength", String(diffusionParams.denoisingStrength));
          sd3FormData.append("aspect_ratio", targetRatio);
          sd3FormData.append("model", "sd3.5-large");
          sd3FormData.append("output_format", "png");

          const sd3Res = await fetch("https://api.stability.ai/v2beta/stable-image/generate/sd3", {
            method: "POST",
            headers: {
              authorization: `Bearer ${this.apiKey}`,
              accept: "application/json",
            },
            signal: signal ?? AbortSignal.timeout(90_000),
            body: sd3FormData,
          });

          if (sd3Res.ok) {
            const sd3Data = await sd3Res.json();
            base64Image = sd3Data.image;
            usedMethod = "stability-sd3-img2img";
            isDegraded = false;
          } else {
            const errText = await sd3Res.text().catch(() => "");
            const sanitized = sanitizeErrorMessage(new Error(errText), [this.apiKey]).slice(0, 300);
            console.error(`[stability] SD3 img2img HTTP ${sd3Res.status}: ${sanitized}`);
          }
        } catch (sd3Err) {
          if (sd3Err instanceof AiPipelineError) throw sd3Err;
          const msg = sanitizeErrorMessage(sd3Err, [this.apiKey]).slice(0, 300);
          console.error(`[stability] SD3 exception: ${msg}`);
        }
      }

      // 3. Fallback to Stable Image Core if img2img was not applicable or failed
      if (!base64Image) {
        const formData = new FormData();
        formData.append("prompt", generationPrompt.slice(0, 1000));
        formData.append("negative_prompt", negativePrompt.slice(0, 500));
        formData.append("aspect_ratio", targetRatio);
        formData.append("output_format", "png");

        const res = await fetch("https://api.stability.ai/v2beta/stable-image/generate/core", {
          method: "POST",
          headers: {
            authorization: `Bearer ${this.apiKey}`,
            accept: "application/json",
          },
          signal: signal ?? AbortSignal.timeout(90_000),
          body: formData,
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          const sanitized = sanitizeErrorMessage(new Error(errText), [this.apiKey]).slice(0, 300);
          throw new AiPipelineError(
            `Stability Core failed: ${sanitized}`,
            "provider",
            { provider: "stability", status: res.status }
          );
        }

        const data = await res.json();
        base64Image = data.image;
        usedMethod = "stability-core";
        isDegraded = true;
      }

      if (!base64Image) {
        throw new AiPipelineError(
          "Stability AI did not return image data after all strategies.",
          "provider",
          { provider: "stability" }
        );
      }

      const imageUrl = `data:image/png;base64,${base64Image}`;

      return {
        id: `stability-${Date.now()}-${index}`,
        imageUrl,
        prompt: generationPrompt,
        angle: angleName,
        consistencyScore: null,
        validation: {
          score: null,
          checks: {},
          status: "unverified",
          notes: [
            usedMethod === "stability-inpaint"
              ? "Metode: Stability Inpaint (Presisi Tinggi — area produk asli dipertahankan menggunakan binary mask)."
              : usedMethod === "stability-sd3-img2img"
              ? "Metode: Stability SD3 Image-to-Image (Presisi Menengah/Parsial — memakai foto produk asli sebagai panduan difusi)."
              : "Metode: Stability Core Fallback (Degraded — text-to-image tanpa foto produk asli).",
            "Audit visual dilewati: provider generation-only.",
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
        console.error(`[stability] Generation failed for index ${idx}: stage=${r.reason instanceof AiPipelineError ? r.reason.stage : "unknown"} msg=${sanitized}`);
      }
    });

    if (successfulOutputs.length === 0) {
      const firstRejected = settled.find((r) => r.status === "rejected") as PromiseRejectedResult;
      const reason = firstRejected?.reason;
      if (reason instanceof AiPipelineError) throw reason;
      throw new AiPipelineError(
        sanitizeErrorMessage(reason, [this.apiKey]).slice(0, 300) || "Failed to generate images with Stability AI.",
        "provider",
        { provider: "stability" }
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
        "Visual consistency check skipped: Stability AI is generation-only and does not support vision evaluation.",
      ],
      isFallback: true,
      validatedAt: new Date().toISOString(),
    };
  }
}
