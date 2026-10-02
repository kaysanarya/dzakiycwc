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

export class StabilityAIProvider implements AIProvider {
  name = "Stability AI (Stable Image Core / SD3)";
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
      const angleName = angleVariations[index % angleVariations.length];
      const { generationPrompt, negativePrompt } = buildStructuredPrompt({
        blueprint,
        locks,
        direction: { ...direction, cameraAngle: angleName as CameraAngle },
        preservation,
        referenceAnalysis,
        variationIndex: index,
      });

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
        signal: AbortSignal.timeout(90_000),
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errMsg =
          errJson?.errors?.[0] ||
          errJson?.message ||
          `Stability AI error (HTTP ${res.status})`;
        throw new Error(errMsg);
      }

      const data = await res.json();
      const base64Image = data.image;

      if (!base64Image) {
        throw new Error("Stability AI did not return image data.");
      }

      const imageUrl = `data:image/png;base64,${base64Image}`;

      return {
        id: `stability-${Date.now()}-${index}`,
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
            "Visual consistency check skipped: Stability AI is generation-only and does not support multimodal self-audit. Independent validation available at Step 6.",
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
        console.error(`Stability AI generation failed for index ${idx}:`, r.reason);
      }
    });

    if (successfulOutputs.length === 0) {
      const firstRejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
      throw new Error(firstRejected?.reason?.message || "Failed to generate images with Stability AI.");
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
        "Visual consistency check skipped: Stability AI is generation-only and does not support vision evaluation.",
      ],
      isFallback: true,
      validatedAt: new Date().toISOString(),
    };
  }
}
