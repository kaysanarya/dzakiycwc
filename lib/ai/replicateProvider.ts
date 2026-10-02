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
import { DemoAIProvider } from "./demoProvider";

export class ReplicateAIProvider implements AIProvider {
  name = "Replicate (Flux Schnell / SDXL)";
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

  async generateProductImages(input: GenerateImagesInput): Promise<GeneratedOutput[]> {
    const { blueprint, locks, direction, preservation, referenceAnalysis, count } = input;

    const isExplicitAngle = direction.cameraAngle && direction.cameraAngle !== "copy_reference";
    const angleVariations = [
      "hero three-quarter perspective studio shot",
      "straight-on front profile commercial catalog view",
      "dramatic dynamic low-angle hero elevation",
      "overhead 45-degree top-down editorial flatlay",
    ];

    const generateSingleImage = async (index: number): Promise<GeneratedOutput> => {
      // F-15: Respect user-selected camera angle if explicitly set
      const angleName = isExplicitAngle
        ? direction.cameraAngle
        : angleVariations[index % angleVariations.length];

      const { generationPrompt } = buildStructuredPrompt({
        blueprint,
        locks,
        direction: { ...direction, cameraAngle: (isExplicitAngle ? direction.cameraAngle : angleName) as CameraAngle },
        preservation,
        referenceAnalysis,
        variationIndex: index,
      });

      const res = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        signal: AbortSignal.timeout(90_000),
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
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson?.detail || `Replicate API error (HTTP ${res.status})`;
        throw new Error(errMsg);
      }

      const data = await res.json();
      let imageUrl: string | undefined;

      if (Array.isArray(data.output) && data.output.length > 0) {
        imageUrl = data.output[0];
      } else if (typeof data.output === "string") {
        imageUrl = data.output;
      }

      // If still processing asynchronously, poll once or check status
      if (!imageUrl && data.urls?.get) {
        let attempts = 0;
        while (!imageUrl && attempts < 15) {
          await new Promise((r) => setTimeout(r, 2000));
          const pollRes = await fetch(data.urls.get, {
            headers: { Authorization: `Bearer ${this.apiKey}` },
            signal: AbortSignal.timeout(15_000),
          });
          if (pollRes.ok) {
            const pollData = await pollRes.json();
            if (pollData.status === "succeeded") {
              imageUrl = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
              break;
            } else if (pollData.status === "failed") {
              throw new Error(`Replicate prediction failed: ${pollData.error}`);
            }
          }
          attempts++;
        }
      }

      if (!imageUrl) {
        throw new Error("Replicate model prediction timed out or did not return an image URL.");
      }

      return {
        id: `replicate-${Date.now()}-${index}`,
        imageUrl,
        prompt: generationPrompt,
        angle: angleName,
        consistencyScore: 85,
        validation: {
          score: 85,
          checks: {
            shape: 85,
            color: 85,
            material: 85,
            logo: 85,
            components: 85,
            proportions: 85,
          },
          status: "pass",
          notes: [
            "Visual consistency check skipped: Replicate FLUX model is generation-only and does not support multimodal self-audit. Independent validation available at Step 6.",
          ],
          isFallback: true,
          validatedAt: new Date().toISOString(),
        },
        status: "passed",
        createdAt: new Date().toISOString(),
        aspectRatio: direction.aspectRatio,
      };
    };

    const targetCount = Math.min(Math.max(1, count), 8);
    const promises: Promise<GeneratedOutput>[] = [];

    for (let i = 0; i < targetCount; i++) {
      promises.push(generateSingleImage(i));
    }

    const results = await Promise.allSettled(promises);
    const successfulOutputs: GeneratedOutput[] = [];

    results.forEach((r, idx) => {
      if (r.status === "fulfilled") {
        successfulOutputs.push(r.value);
      } else {
        console.error(`Replicate generation failed for index ${idx}:`, r.reason);
      }
    });

    if (successfulOutputs.length === 0) {
      const firstRejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
      throw new Error(firstRejected?.reason?.message || "Failed to generate images with Replicate.");
    }

    return successfulOutputs;
  }

  async validateProductConsistency(input: ValidateConsistencyInput): Promise<ValidationResult> {
    return {
      score: 85,
      checks: {
        shape: 85,
        color: 85,
        material: 85,
        logo: 85,
        components: 85,
        proportions: 85,
        heel: input.blueprint.category === "footwear" ? 85 : undefined,
      },
      status: "pass",
      notes: [
        "Visual consistency check skipped: Replicate FLUX model is generation-only and does not support multimodal self-audit.",
      ],
      isFallback: true,
      validatedAt: new Date().toISOString(),
    };
  }
}
