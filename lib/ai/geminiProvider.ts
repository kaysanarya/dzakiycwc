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
import { buildStructuredPrompt, buildBackgroundPlatePrompt } from "@/lib/prompts/buildPrompt";
import { compositeProductOnPlate } from "./studioCompositor";
import { parseAIJsonResponse } from "./safeJson";
import { sanitizeErrorMessage } from "@/lib/auth/serverAuth";
import { AiPipelineError } from "./AiPipelineError";

export class GeminiAIProvider implements AIProvider {
  name = "Google Gemini Multimodal + Imagen";
  isDemo = false;
  private apiKey: string;
  private visionModel: string;
  private imageModel: string;
  private validationModel: string;

  constructor(options: {
    apiKey: string;
    visionModel?: string;
    imageModel?: string;
    validationModel?: string;
  }) {
    this.apiKey = options.apiKey;
    this.visionModel = options.visionModel || "gemini-2.0-flash";
    this.imageModel = options.imageModel || "imagen-3.0-generate-002";
    this.validationModel = options.validationModel || "gemini-2.0-flash";
  }

  async analyzeProduct(input: AnalyzeProductInput): Promise<ProductBlueprint> {
    try {
      const prompt = `Analyze the uploaded raw product images with extreme precision.
You are generating a formal PRODUCT BLUEPRINT for commercial product photography.
Extract every physical attribute into the following JSON format ONLY:
{
  "category": "${input.categoryHint || "footwear"}",
  "subcategory": "string",
  "shape": "detailed geometric and silhouette description",
  "dimensions": "estimated proportions and scale",
  "proportions": "relative component ratios",
  "material": "specific materials identified",
  "color": "precise color names and hex tones",
  "texture": "tactile micro-surface description",
  "components": ["list of distinct physical components"],
  "logo": {
    "presence": boolean,
    "placement": "string or null",
    "style": "string or null",
    "description": "string or null"
  },
  "stitching": {
    "pattern": "string or null",
    "color": "string or null",
    "contrast": boolean
  },
  "ornaments": ["list of hardware/accents"],
  "hardware": {
    "type": "string or null",
    "finish": "string or null",
    "color": "string or null"
  },
  "outsole": {
    "material": "string",
    "color": "string",
    "profile": "string",
    "pattern": "string"
  },
  "heel": {
    "heelHeight": "string (e.g. 85mm)",
    "heelWidth": "string",
    "heelAngle": "string",
    "heelPosition": "string",
    "heelShape": "string (e.g. flared hourglass)",
    "heelThickness": "string",
    "frontSoleThickness": "string",
    "outsolePattern": "string"
  },
  "construction": "assembly type (e.g. blake stitched, cemented, Goodyear)",
  "visualNotes": "critical preservation directives",
  "confidence": 0.95
}
Return only valid raw JSON.`;

      // Build image parts for Gemini API
      const inlineDataParts = input.images.slice(0, 4).map((img) => {
        const base64Data = img.dataUrl.includes(",")
          ? img.dataUrl.split(",")[1]
          : img.dataUrl;
        return {
          inline_data: {
            mime_type: img.type || "image/jpeg",
            data: base64Data,
          },
        };
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.visionModel}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(60_000),
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }, ...inlineDataParts],
              },
            ],
            generationConfig: {
              response_mime_type: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini Vision API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = parseAIJsonResponse<ProductBlueprint>(
        content,
        "Analisis produk AI gagal",
        this.apiKey
      );
      return parsed;
    } catch (err) {
      const sanitized = sanitizeErrorMessage(err, [this.apiKey]).slice(0, 300);
      console.warn(`[gemini] analyzeProduct vision failed: ${sanitized}`);
      return {
        category: input.categoryHint || "footwear",
        subcategory: "Standard Commercial Product",
        shape: "Preserved from source image silhouette",
        proportions: "Standard commercial scale",
        material: "Identified from source image",
        color: "Preserved authentic tone",
        texture: "Authentic surface grain",
        components: ["Main body", "Support structure", "Base"],
        construction: "Manufactured product",
        visualNotes: `Analisis otomatis tidak tersedia (${sanitized}). Gunakan blueprint dasar.`,
        confidence: 0,
        isFallback: true,
      };
    }
  }

  async analyzeReference(input: AnalyzeReferenceInput): Promise<ReferenceAnalysis> {
    try {
      const prompt = `Analyze this reference photography image. Extract ONLY lighting, background, composition, camera direction, and mood.
Return JSON ONLY:
{
  "lightingDirection": "string",
  "lightQuality": "string",
  "colorTemperature": "string",
  "backgroundStyle": "string",
  "shadowType": "string",
  "framingComposition": "string",
  "mood": "string"
}`;

      const inlineDataParts = input.images.slice(0, 1).map((img) => {
        const base64Data = img.dataUrl.includes(",")
          ? img.dataUrl.split(",")[1]
          : img.dataUrl;
        return {
          inline_data: {
            mime_type: img.type || "image/jpeg",
            data: base64Data,
          },
        };
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.visionModel}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(60_000),
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }, ...inlineDataParts],
              },
            ],
            generationConfig: {
              response_mime_type: "application/json",
            },
          }),
        }
      );

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return parseAIJsonResponse<ReferenceAnalysis>(
        content,
        "Analisis referensi AI gagal",
        this.apiKey
      );
    } catch (err) {
      console.error("Gemini analyzeReference error:", sanitizeErrorMessage(err, [this.apiKey]));
      return {
        lightingDirection: "Soft directional key light 45° camera left",
        lightQuality: "Diffuse commercial softbox with gentle rim highlight",
        colorTemperature: "5000K balanced daylight",
        backgroundStyle: "Minimalist warm studio backdrop",
        shadowType: "Soft ambient ground contact shadow",
        framingComposition: "Centered product isolation with generous breathing room",
        mood: "Refined luxury commercial catalog",
      };
    }
  }

  async generateProductImages(input: GenerateImagesInput): Promise<GeneratedOutput[]> {
    const isHumanModel = input.direction.modelSetting === "human_model" || input.direction.modelSetting === "partial_hands";
    if (isHumanModel) {
      throw new AiPipelineError(
        "Opsi 'Dipakai di Kaki / Dipegang Tangan' adalah eksperimental dan hanya aktif bila provider mendukung image-conditioned editing (Stability AI / Replicate). Google Gemini / Imagen tidak mendukung editing berbasis gambar.",
        "provider",
        { provider: "gemini" }
      );
    }

    const count = Math.min(Math.max(1, input.count), 8);
    const signal = (input as { signal?: AbortSignal }).signal;

    const generateSingleImage = async (i: number): Promise<GeneratedOutput> => {
      const promptData = buildStructuredPrompt({
        blueprint: input.blueprint,
        locks: input.locks,
        direction: input.direction,
        preservation: input.preservation,
        referenceAnalysis: input.referenceAnalysis,
        variationIndex: i,
      });

      let lastError: string | undefined;
      let lastStatus: number | undefined;

      // 1. Try Multimodal Gemini Image Generation with strict product lock prompt
      if (input.sourceImages && input.sourceImages.length > 0) {
        const multimodalModels = [
          "gemini-2.0-flash-preview-image-generation",
          "gemini-2.0-flash-exp",
        ];

        for (const mmModel of multimodalModels) {
          try {
            const rawBase64 = input.sourceImages[0].dataUrl.includes(",")
              ? input.sourceImages[0].dataUrl.split(",")[1]
              : input.sourceImages[0].dataUrl;
            const mimeType = input.sourceImages[0].type || "image/jpeg";
            const multimodalPrompt = `${promptData.systemPrompt}

${promptData.generationPrompt}

CRITICAL EXECUTION RULES FOR PRODUCT PHOTOGRAPHY DIRECTOR (INPAINTING & ENVIRONMENT RE-RENDER):
1. TRUE INPAINTING & ENVIRONMENT RE-RENDER:
   - The primary input image contains an isolated transparent product subject.
   - DO NOT just paste the original image or draw a flat rectangle.
   - You MUST generate a completely new commercial photography studio environment AROUND and DIRECTLY UNDERNEATH this transparent product subject.
   - Seamlessly integrate the product into the environment. Generate highly realistic raytraced contact shadows directly underneath the product based on the new lighting direction. No floating products.
   - Re-render the visual scene with realistic 3D diffusion depth, volumetric studio lighting, global illumination, and authentic raytraced contact shadows under the product base.
   - Cast directional rim highlights matching the key light scrim to contour the product edges.

2. PHYSICAL PRODUCT IDENTITY (STRICT GEOMETRY LOCK):
   - The primary input image contains the authentic product to preserve.
   - Maintain 100% fidelity to the physical geometry, branding/logos, stitching, hardware, strap placement, and material texture.
   - Do NOT morph, warp, replace, simplify, or redesign the product.

3. PERSPECTIVE & COMPOSITION:
   - Perspective: Commercial Studio Angle ${i + 1} (${promptData.structuredDirectives.cameraAngle}).
   - Aspect ratio: ${input.direction.aspectRatio}.
   - Diffusion Denoising Latitude: ${promptData.diffusionParams.denoisingStrength} (high latitude for studio environment, zero drift for product core).
`;

            const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
              { text: multimodalPrompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: rawBase64,
                },
              },
            ];

            // If reference image provided, pass it as style guidance with its calculated reference strength
            if (input.referenceImages && input.referenceImages.length > 0 && promptData.diffusionParams.referenceStrength > 0.05) {
              const refImg = input.referenceImages[0];
              const refBase64 = refImg.dataUrl.includes(",")
                ? refImg.dataUrl.split(",")[1]
                : refImg.dataUrl;
              const refMime = refImg.type || "image/jpeg";
              parts.push({
                text: `[PHOTOGRAPHY STYLE & LIGHTING REFERENCE - INFLUENCE WEIGHT: ${(promptData.diffusionParams.referenceStrength * 100).toFixed(0)}%]:
Extract ONLY the photographic lighting style, color temperature, shadow softness, and ambient studio mood from this reference image. DO NOT copy the product or objects from this reference image. Apply its lighting aesthetic onto the new scene at ${(promptData.diffusionParams.referenceStrength * 100).toFixed(0)}% intensity.`,
              });
              parts.push({
                inlineData: {
                  mimeType: refMime,
                  data: refBase64,
                },
              });
            }

            const payload = {
              contents: [
                {
                  role: "user",
                  parts,
                },
              ],
              generationConfig: {
                responseModalities: ["TEXT", "IMAGE"],
                temperature: 0.35,
              },
            };

            const mmRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${mmModel}:generateContent?key=${this.apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: signal ?? AbortSignal.timeout(90_000),
                body: JSON.stringify(payload),
              }
            );

            if (!mmRes.ok) {
              const errText = await mmRes.text().catch(() => "");
              const sanitized = sanitizeErrorMessage(new Error(errText), [this.apiKey]).slice(0, 300);
              console.warn(`[gemini] Multimodal model ${mmModel} HTTP ${mmRes.status}: ${sanitized}`);
              lastError = sanitized;
              lastStatus = mmRes.status;
              continue;
            }

            const resJson = await mmRes.json();

            // Check for API-level error in response body
            if (resJson?.error) {
              const sanitized = sanitizeErrorMessage(new Error(resJson.error.message || "API error"), [this.apiKey]).slice(0, 300);
              console.warn(`[gemini] Multimodal model ${mmModel} API error: ${sanitized}`);
              lastError = sanitized;
              continue;
            }

            const resParts = resJson?.candidates?.[0]?.content?.parts;
            if (!resParts || resParts.length === 0) {
              console.warn(`[gemini] Multimodal model ${mmModel} returned empty parts, skipping.`);
              lastError = `Multimodal model ${mmModel} returned empty parts`;
              continue;
            }

            const imagePart = resParts.find(
              (p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData?.data
            );
            if (!imagePart) {
              console.warn(`[gemini] Multimodal model ${mmModel} returned no image part, skipping.`);
              lastError = `Multimodal model ${mmModel} returned no image part`;
              continue;
            }

            const base64Out = imagePart.inlineData.data;
            const outMime = imagePart.inlineData.mimeType || "image/jpeg";
            const imageUrl = `data:${outMime};base64,${base64Out}`;

            const validation = await this.validateProductConsistency({
              sourceImages: input.sourceImages,
              generatedImageUrl: imageUrl,
              blueprint: input.blueprint,
              locks: input.locks,
              angle: `Commercial Angle ${i + 1}`,
            });

            return {
              id: `gemini-gen-${Date.now()}-${i + 1}`,
              imageUrl,
              prompt: promptData.generationPrompt,
              angle: `Commercial Angle ${i + 1}`,
              consistencyScore: validation.score,
              validation,
              status: validation.status === "pass" ? "passed" : "rejected",
              createdAt: new Date().toISOString(),
              aspectRatio: input.direction.aspectRatio,
              degraded: false,
              method: "gemini-multimodal",
            };
          } catch (mmErr) {
            const sanitized = sanitizeErrorMessage(mmErr, [this.apiKey]).slice(0, 300);
            console.warn(`[gemini] Multimodal model ${mmModel} exception: ${sanitized}`);
            lastError = sanitized;
          }
        }
      }

      // 2. Generate Background Plate with Imagen 3 and composite authentic product
      const { platePrompt, negativePrompt: plateNegativePrompt } = buildBackgroundPlatePrompt({
        direction: input.direction,
        referenceAnalysis: input.referenceAnalysis,
        variationIndex: i,
      });

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${this.imageModel}:predict?key=${this.apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: signal ?? AbortSignal.timeout(90_000),
            body: JSON.stringify({
              instances: [{ prompt: platePrompt }],
              parameters: {
                sampleCount: 1,
                aspectRatio: input.direction.aspectRatio === "1:1" ? "1:1" : input.direction.aspectRatio === "9:16" ? "9:16" : "3:4",
                negativePrompt: plateNegativePrompt,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
          if (base64Image) {
            const plateBuffer = Buffer.from(base64Image, "base64");
            let finalImageUrl = `data:image/jpeg;base64,${base64Image}`;

            if (input.sourceImages && input.sourceImages.length > 0) {
              const rawSource = input.sourceImages[0].dataUrl;
              const b64Data = rawSource.includes(",") ? rawSource.split(",")[1] : rawSource;
              const productCutoutBuffer = Buffer.from(b64Data, "base64");

              const compositeBuffer = await compositeProductOnPlate({
                plateBuffer,
                productCutoutBuffer,
              });
              finalImageUrl = `data:image/jpeg;base64,${compositeBuffer.toString("base64")}`;
            }

            const validation = await this.validateProductConsistency({
              sourceImages: input.sourceImages,
              generatedImageUrl: finalImageUrl,
              blueprint: input.blueprint,
              locks: input.locks,
              angle: `Commercial Angle ${i + 1}`,
            });

            return {
              id: `real-gen-${Date.now()}-${i + 1}`,
              imageUrl: finalImageUrl,
              prompt: platePrompt,
              angle: `Commercial Angle ${i + 1}`,
              consistencyScore: validation.score,
              validation,
              status: validation.status === "needs_regeneration" ? "rejected" : "passed",
              createdAt: new Date().toISOString(),
              aspectRatio: input.direction.aspectRatio,
              degraded: false,
              method: "gemini-plate-composite",
            };
          }
        } else {
          const errText = await response.text().catch(() => "");
          const sanitized = sanitizeErrorMessage(new Error(errText), [this.apiKey]).slice(0, 300);
          console.warn(`[gemini] Imagen HTTP ${response.status}: ${sanitized}`);
          lastError = sanitized;
          lastStatus = response.status;
        }
      } catch (genErr) {
        const sanitized = sanitizeErrorMessage(genErr, [this.apiKey]).slice(0, 300);
        console.warn(`[gemini] Imagen exception: ${sanitized}`);
        lastError = sanitized;
      }

      // No demo fallback — fail explicitly with AiPipelineError
      throw new AiPipelineError(
        `Gemini/Imagen generation failed: ${lastError || "No image data returned"}`,
        "provider",
        { provider: "gemini", status: lastStatus }
      );
    };

    const promises: (() => Promise<GeneratedOutput>)[] = [];
    for (let i = 0; i < count; i++) {
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
        console.error(
          `[gemini] Generation failed for index ${idx}: stage=${r.reason instanceof AiPipelineError ? r.reason.stage : "unknown"} msg=${sanitized}`
        );
      }
    });

    if (successfulOutputs.length === 0) {
      const firstRejected = settled.find((r) => r.status === "rejected") as PromiseRejectedResult;
      const reason = firstRejected?.reason;
      if (reason instanceof AiPipelineError) throw reason;
      throw new AiPipelineError(
        sanitizeErrorMessage(reason, [this.apiKey]).slice(0, 300) || "Failed to generate images with Gemini/Imagen.",
        "provider",
        { provider: "gemini" }
      );
    }

    return successfulOutputs;
  }

  async validateProductConsistency(
    input: ValidateConsistencyInput
  ): Promise<ValidationResult> {
    try {
      const prompt = `You are a Commercial Studio Photography Quality Inspector auditing the compositing quality of a commercial product photo.
Image 1 is the original raw product. Image 2 is the composited studio photograph.
Inspect:
1. Mask Quality & Edges: Clean alpha boundaries without harsh fringes, halos, or cutout artifacts.
2. Placement & Grounding: The product is seated naturally on the surface with realistic contact shadows, not floating, not cut off at borders.
3. Scale & Proportions: Product is well-proportioned within the commercial catalog frame (50-75% height).
Return JSON ONLY:
{
  "score": number (0-100),
  "checks": {
    "shape": number (0-100, edge cleanliness),
    "color": number (0-100, shadow tone matching),
    "material": number (0-100),
    "logo": number (0-100),
    "components": number (0-100, no clipped elements),
    "proportions": number (0-100, scale balance)
  },
  "status": "pass" | "needs_regeneration",
  "notes": ["list of findings regarding mask edges, placement, and shadows"]
}`;

      // Extract raw base64 and mime type from source product image (F-07)
      let sourceBase64: string | undefined;
      let sourceMime = "image/jpeg";
      const sourceImg = input.sourceImages && input.sourceImages.length > 0 ? input.sourceImages[0] : null;
      if (sourceImg?.dataUrl) {
        if (sourceImg.dataUrl.includes(",")) {
          const [header, b64] = sourceImg.dataUrl.split(",");
          sourceBase64 = b64;
          const match = header.match(/:(.*?);/);
          if (match) sourceMime = match[1];
        } else {
          sourceBase64 = sourceImg.dataUrl;
          sourceMime = sourceImg.type || "image/jpeg";
        }
      }

      // Extract raw base64 and mime type from generated image (F-07)
      let genBase64: string | undefined;
      let genMime = "image/jpeg";
      if (input.generatedImageUrl.startsWith("data:")) {
        const [header, b64] = input.generatedImageUrl.split(",");
        genBase64 = b64;
        const match = header.match(/:(.*?);/);
        if (match) genMime = match[1];
      } else if (input.generatedImageUrl.startsWith("http://") || input.generatedImageUrl.startsWith("https://")) {
        try {
          const imgRes = await fetch(input.generatedImageUrl, { signal: AbortSignal.timeout(15_000) });
          if (imgRes.ok) {
            const buf = await imgRes.arrayBuffer();
            genBase64 = Buffer.from(buf).toString("base64");
            genMime = imgRes.headers.get("content-type") || "image/jpeg";
          }
        } catch {
          // If network image download fails, proceed with available visual data
        }
      }

      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
      if (sourceBase64) {
        parts.push({
          inlineData: {
            mimeType: sourceMime,
            data: sourceBase64,
          },
        });
      }
      if (genBase64) {
        parts.push({
          inlineData: {
            mimeType: genMime,
            data: genBase64,
          },
        });
      }
      parts.push({ text: prompt });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.validationModel}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(60_000),
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts,
              },
            ],
            generationConfig: {
              response_mime_type: "application/json",
            },
          }),
        }
      );

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = parseAIJsonResponse<Partial<ValidationResult>>(
        content,
        "Validasi konsistensi AI gagal",
        this.apiKey
      );
      return {
        score: typeof parsed.score === "number" ? parsed.score : null,
        checks: parsed.checks || {},
        status: parsed.status === "needs_regeneration" ? "needs_regeneration" : typeof parsed.score === "number" && parsed.score >= 85 ? "pass" : "unverified",
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        validatedAt: new Date().toISOString(),
        isFallback: false,
      };
    } catch (err) {
      const sanitized = sanitizeErrorMessage(err, [this.apiKey]).slice(0, 300);
      console.warn(`[gemini] Visual validation failed, returning unverified status: ${sanitized}`);
      return {
        score: null,
        checks: {},
        status: "unverified",
        notes: [
          `Visual validation unavailable (${sanitized}). Skor tidak dapat diverifikasi secara otomatis.`,
        ],
        validatedAt: new Date().toISOString(),
        isFallback: true,
      };
    }
  }
}
