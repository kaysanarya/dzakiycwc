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
} from "@/types";
import {
  DEMO_FOOTWEAR_BLUEPRINT,
  DEMO_REFERENCE_ANALYSIS,
} from "./demoData";
import { generateProceduralPlate, compositeProductOnPlate } from "./studioCompositor";
import { AiPipelineError } from "./AiPipelineError";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class DemoAIProvider implements AIProvider {
  name = "HARVIE Demo Studio Engine";
  isDemo = true;

  async analyzeProduct(input: AnalyzeProductInput): Promise<ProductBlueprint> {
    await delay(1200);

    const isFootwear =
      input.categoryHint === "footwear" ||
      input.images.some(
        (img) =>
          img.name?.toLowerCase().includes("mule") ||
          img.name?.toLowerCase().includes("shoe") ||
          img.name?.toLowerCase().includes("heel") ||
          img.name?.toLowerCase().includes("footwear")
      );

    if (isFootwear) {
      return {
        ...DEMO_FOOTWEAR_BLUEPRINT,
        visualNotes:
          "Demo mode analysis: Detected footwear silhouette with sculpted heel elevation, chisel toe, and signature hardware.",
      };
    }

    // Generic realistic blueprint for user-uploaded custom products in Demo Mode
    const detectedCategory = input.categoryHint || "accessories";
    return {
      category: detectedCategory,
      subcategory: `Premium Crafted ${detectedCategory}`,
      shape: "Sculptural organic silhouette with balanced planar geometry",
      dimensions: "Standard commercial proportions, 1:1.2 aspect silhouette",
      proportions: "Harmonious symmetrical balance with ergonomic contours",
      material: "Full-grain calfskin leather and micro-brushed hardware",
      color: "Warm Neutral Tonal Palette with soft matte finish",
      texture: "Refined tactile micro-grain surface with zero artificial sheen",
      components: [
        "Primary structural body casing",
        "Reinforced load-bearing perimeter seam",
        "Hardware closure attachment",
        "Precision burnished edge finishing",
      ],
      logo: {
        presence: true,
        placement: "Centered front subtle debossed signature",
        style: "Minimalist sans-serif luxury emblem",
        description: "Subtle tone-on-tone stamp",
      },
      stitching: {
        pattern: "Perimeter single-needle lockstitch with 3mm spacing",
        color: "Matching tonal thread",
        contrast: false,
      },
      construction: "Hand-finished artisanal construction with reinforced core",
      visualNotes:
        "Demo mode vision analysis: Physical silhouette, material boundaries, and hardware placements mapped into structured blueprint.",
      confidence: 0.94,
    };
  }

  async analyzeReference(input: AnalyzeReferenceInput): Promise<ReferenceAnalysis> {
    void input;
    await delay(900);
    return DEMO_REFERENCE_ANALYSIS;
  }

  async generateProductImages(input: GenerateImagesInput): Promise<GeneratedOutput[]> {
    const isHumanModel = input.direction.modelSetting === "human_model" || input.direction.modelSetting === "partial_hands";
    if (isHumanModel) {
      throw new AiPipelineError(
        "Opsi 'Dipakai di Kaki / Dipegang Tangan' adalah eksperimental dan hanya aktif bila provider mendukung image-conditioned editing (Stability AI / Replicate). Demo Mode hanya mendukung Plate + Composite.",
        "provider",
        { provider: "demo" }
      );
    }

    const outputs: GeneratedOutput[] = [];
    const count = Math.min(Math.max(1, input.count), 8);

    const angleList = [
      "Top-Down Flatlay View",
      "Hero 3/4 Perspective",
      "Lateral Side Profile",
      "Dynamic Low-Angle",
    ];

    for (let i = 0; i < count; i++) {
      await delay(300);
      const angleName = angleList[i % angleList.length];

      // Step 1: Generate procedural studio cyclorama / podium plate
      const plateBuffer = await generateProceduralPlate({
        aspectRatio: input.direction.aspectRatio,
        backgroundSetting: input.direction.background,
        customBackground: input.direction.customBackground,
      });

      let finalImageUrl = `data:image/png;base64,${plateBuffer.toString("base64")}`;

      // Step 2: Composite user's authentic product cutout onto the plate
      if (input.sourceImages && input.sourceImages.length > 0) {
        const rawSource = input.sourceImages[i % input.sourceImages.length]?.dataUrl;
        if (rawSource) {
          const b64Data = rawSource.includes(",") ? rawSource.split(",")[1] : rawSource;
          const productCutoutBuffer = Buffer.from(b64Data, "base64");

          const compositeBuffer = await compositeProductOnPlate({
            plateBuffer,
            productCutoutBuffer,
            cameraAngle: input.direction.cameraAngle,
            variationIndex: i,
          });
          finalImageUrl = `data:image/jpeg;base64,${compositeBuffer.toString("base64")}`;
        }
      }

      const validation: ValidationResult = {
        score: 90,
        status: "pass",
        checks: {
          shape: 90,
          proportions: 90,
        },
        notes: [
          "Demo — latar prosedural, bukan hasil AI generatif",
        ],
        validatedAt: new Date().toISOString(),
        isFallback: true,
      };

      outputs.push({
        id: `demo-gen-${Date.now()}-${i + 1}`,
        imageUrl: finalImageUrl,
        thumbnailUrl: finalImageUrl,
        prompt: `Demo studio cyclorama plate (${input.direction.background || "studio_beige"})`,
        angle: angleName,
        consistencyScore: 90,
        validation,
        status: "passed",
        createdAt: new Date().toISOString(),
        aspectRatio: input.direction.aspectRatio,
        degraded: true,
        method: "demo-procedural-composite",
      });
    }

    return outputs;
  }

  async validateProductConsistency(
    input: ValidateConsistencyInput
  ): Promise<ValidationResult> {
    void input;
    await delay(300);

    return {
      score: 90,
      status: "pass",
      checks: {
        shape: 90,
        proportions: 90,
      },
      notes: [
        "Demo — latar prosedural, bukan hasil AI generatif",
      ],
      validatedAt: new Date().toISOString(),
      isFallback: true,
    };
  }
}
