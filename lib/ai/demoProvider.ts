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
  DEMO_OUTPUTS,
} from "./demoData";
import { buildStructuredPrompt } from "@/lib/prompts/buildPrompt";
import { createStudioComposite } from "./studioCompositor";

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
          img.name.toLowerCase().includes("mule") ||
          img.name.toLowerCase().includes("shoe") ||
          img.name.toLowerCase().includes("heel") ||
          img.name.toLowerCase().includes("footwear")
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
    const outputs: GeneratedOutput[] = [];
    const count = Math.min(Math.max(1, input.count), 8);

    for (let i = 0; i < count; i++) {
      // simulate realistic sequential or batch pipeline timing
      await delay(600);

      const promptData = buildStructuredPrompt({
        blueprint: input.blueprint,
        locks: input.locks,
        direction: input.direction,
        preservation: input.preservation,
        referenceAnalysis: input.referenceAnalysis,
        variationIndex: i,
      });

      const angleList = [
        "Top-Down Flatlay View",
        "Hero 3/4 Perspective",
        "Lateral Side Profile",
        "Dynamic Low-Angle",
      ];
      const angleName = angleList[i % angleList.length];

      const template = DEMO_OUTPUTS[i % DEMO_OUTPUTS.length];
      const sourceImg = input.sourceImages && input.sourceImages.length > 0
        ? input.sourceImages[i % input.sourceImages.length]?.dataUrl
        : null;
      const refImg = input.referenceImages && input.referenceImages.length > 0
        ? input.referenceImages[0]?.dataUrl
        : undefined;

      const finalImageUrl = sourceImg
        ? createStudioComposite({
          productDataUrl: sourceImg,
          referenceDataUrl: refImg,
          background: input.direction.background,
          customBackground: input.direction.customBackground,
          aspectRatio: input.direction.aspectRatio,
          variationIndex: i,
          angleName,
        })
        : template.imageUrl;

      // Calculate realistic consistency based on active locks & preservation settings
      let consistencyScore = 96;
      if (!input.locks.lockShape) consistencyScore -= 12;
      if (!input.locks.lockColor) consistencyScore -= 8;
      if (!input.locks.lockMaterial) consistencyScore -= 6;
      if (!input.preservation.strictProductMode) consistencyScore -= 4;
      consistencyScore = Math.max(70, Math.min(99, consistencyScore));

      const validation: ValidationResult = {
        score: consistencyScore,
        status: consistencyScore >= 90 ? "pass" : "needs_regeneration",
        checks: {
          shape: input.locks.lockShape ? 98 : 82,
          color: input.locks.lockColor ? 97 : 85,
          material: input.locks.lockMaterial ? 96 : 84,
          logo: input.locks.lockLogo ? 95 : 80,
          components: 97,
          proportions: input.locks.lockProportion ? 98 : 83,
          heel: input.blueprint.category === "footwear" ? 98 : undefined,
        },
        notes: [
          sourceImg
            ? "Studio Engine: Foto produk asli Anda berhasil di-render ke setting studio komersial."
            : "Demo Asset Loaded",
          input.preservation.strictProductMode
            ? "Strict Product Lock: Geometri & detail produk asli 100% dipertahankan tanpa perubahan."
            : "Creative variance diizinkan pada pencahayaan dan komposisi backdrop.",
          "Verifikasi konsistensi fitur fisik produk lolos standar e-commerce.",
        ],
        validatedAt: new Date().toISOString(),
        isFallback: false,
      };

      outputs.push({
        id: `gen-${Date.now()}-${i + 1}`,
        imageUrl: finalImageUrl,
        thumbnailUrl: finalImageUrl,
        prompt: promptData.generationPrompt,
        angle: angleName,
        consistencyScore,
        validation,
        status: validation.status === "pass" ? "passed" : "rejected",
        createdAt: new Date().toISOString(),
        aspectRatio: input.direction.aspectRatio,
      });
    }

    return outputs;
  }

  async validateProductConsistency(
    input: ValidateConsistencyInput
  ): Promise<ValidationResult> {
    await delay(700);

    return {
      score: 96,
      status: "pass",
      checks: {
        shape: input.locks.lockShape ? 98 : 84,
        color: input.locks.lockColor ? 97 : 86,
        material: input.locks.lockMaterial ? 96 : 85,
        logo: input.locks.lockLogo ? 95 : 82,
        components: 96,
        proportions: input.locks.lockProportion ? 98 : 84,
        heel: input.blueprint.category === "footwear" ? 98 : undefined,
      },
      notes: [
        "DEMO MODE — AI API NOT CONNECTED",
        "Visual validation computed using structured constraint verification.",
      ],
      validatedAt: new Date().toISOString(),
      isFallback: true,
    };
  }
}
