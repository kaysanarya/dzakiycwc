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

      // Architecture Refactor: Naive compositor removed.
      // Returns authentic studio render templates with blueprint mapping.
      const finalImageUrl = template.imageUrl;

      const validation: ValidationResult = {
        score: null,
        status: "unverified",
        checks: {},
        notes: [
          sourceImg
            ? "Simulasi Demo: Pratinjau template menggunakan aset ilustrasi, bukan hasil inferensi AI langsung."
            : "Demo Asset Loaded",
          "Audit visual dilewati (mode demonstrasi).",
        ],
        validatedAt: new Date().toISOString(),
        isFallback: true,
      };

      outputs.push({
        id: `gen-${Date.now()}-${i + 1}`,
        imageUrl: finalImageUrl,
        thumbnailUrl: finalImageUrl,
        prompt: promptData.generationPrompt,
        angle: angleName,
        consistencyScore: null,
        validation,
        status: "passed",
        createdAt: new Date().toISOString(),
        aspectRatio: input.direction.aspectRatio,
        degraded: true,
        method: "demo",
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
      score: null,
      status: "unverified",
      checks: {},
      notes: [
        "Simulasi Demo: Mode demo tidak menjalankan audit konsistensi visual multimodal.",
      ],
      validatedAt: new Date().toISOString(),
      isFallback: true,
    };
  }
}
