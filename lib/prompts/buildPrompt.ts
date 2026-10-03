import {
  ProductBlueprint,
  ProductLocks,
  PhotographyDirection,
  PreservationSettings,
  ReferenceAnalysis,
} from "@/types";

export interface PromptBuildParams {
  blueprint: ProductBlueprint;
  locks: ProductLocks;
  direction: PhotographyDirection;
  preservation: PreservationSettings;
  referenceAnalysis?: ReferenceAnalysis;
  variationIndex?: number;
}

export interface StructuredPromptOutput {
  systemPrompt: string;
  generationPrompt: string;
  negativePrompt: string;
  structuredDirectives: Record<string, unknown>;
  diffusionParams: {
    denoisingStrength: number;
    guidanceScale: number;
    referenceStrength: number;
    controlnetStrength: number;
    styleWeight: number;
  };
}

export function buildStructuredPrompt(params: PromptBuildParams): StructuredPromptOutput {
  const { blueprint, locks, direction, preservation, referenceAnalysis, variationIndex = 0 } = params;

  // 1. Locked attributes compilation
  const lockedFeatures: string[] = [];
  if (locks.preserveProductDetails) {
    lockedFeatures.push(`PRESERVE AUTHENTIC PRODUCT DETAILS: Authentic physical geometry, colors, and textures strictly preserved`);
  }

  // 2. Camera Angle logic with subtle angle variations for multi-image batches
  const angleDescriptions: Record<string, string> = {
    front: "straight-on front eye-level commercial catalog view",
    three_quarter: "hero three-quarter perspective studio view",
    side: "clean horizontal side profile elevation view",
    top: "overhead 90-degree top-down flatlay perspective",
    low_angle: "dramatic dynamic low-angle upward hero elevation",
    high_angle: "elevated 45-degree high-angle commercial studio perspective",
    macro_detail: "close-up macro detail focusing on texture, stitching, and craftsmanship",
    custom: "custom perspective",
  };

  let angleDirective: string = angleDescriptions[direction.cameraAngle] || direction.cameraAngle;
  if (direction.cameraAngle === "copy_reference" && referenceAnalysis) {
    angleDirective = `match reference camera perspective (${referenceAnalysis.framingComposition})`;
  } else if (direction.cameraAngle === "copy_reference") {
    const variedAngles = [
      "hero three-quarter perspective eye-level studio shot",
      "side profile commercial catalog view",
      "dramatic dynamic low-angle product elevation",
      "overhead 45-degree top-down editorial flatlay angle"
    ];
    angleDirective = variedAngles[variationIndex % variedAngles.length] as string;
  }

  // 3. Background and Environment
  let backgroundDesc = "Neutral luxury minimalist studio setting";
  if (referenceAnalysis && direction.background !== "studio_white" && direction.background !== "transparent") {
    backgroundDesc = `exact lighting and background recreation matching reference: ${referenceAnalysis.backgroundStyle}, lighting: ${referenceAnalysis.lightingDirection}, shadow: ${referenceAnalysis.shadowType}, mood: ${referenceAnalysis.mood || "commercial"}`;
  } else if (direction.background === "studio_beige") {
    backgroundDesc = "warm neutral beige matte studio podium with soft diffuse ambient gradient, high-end commercial aesthetic";
  } else if (direction.background === "studio_white") {
    backgroundDesc = "pure seamless high-key commercial white studio cyclorama with subtle soft natural ground contact shadow";
  } else if (direction.background === "lifestyle") {
    backgroundDesc = "luxurious architectural limestone interior with soft morning daylight, discreet minimal props out of focus";
  } else if (direction.background === "gradient") {
    backgroundDesc = "subtle warm amber-to-slate smooth studio backdrop gradient";
  } else if (direction.background === "transparent") {
    backgroundDesc = "isolated on clean cutout transparent background with authentic grounding shadow mask";
  } else if (direction.background === "exact_reference" && referenceAnalysis) {
    backgroundDesc = `exact lighting and background recreation: ${referenceAnalysis.backgroundStyle}, ${referenceAnalysis.lightingDirection}, ${referenceAnalysis.shadowType}`;
  } else if (direction.background === "custom" && direction.customBackground) {
    backgroundDesc = direction.customBackground;
  }

  // 4. Model styling
  let modelDirective = "Stand-alone product photography, no human models or limbs present.";
  if (direction.modelSetting === "human_model" && direction.modelOptions) {
    const opt = direction.modelOptions;
    modelDirective = `Fashion editorial styling with ${opt.genderPresentation} model in ${opt.clothingStyle} attire, pose: ${opt.pose}, framing: ${opt.bodyFraming}. Product is placed ${opt.productPlacement}. The product remains the focal hero object with zero occlusion of key design elements.`;
  } else if (direction.modelSetting === "partial_hands") {
    modelDirective = "Elegantly manicured stylist hand holding or adjusting the product delicately from the side, framing the product without covering details.";
  }

  // 5. Strict preservation constraints
  const strictEnforcement = preservation.strictProductMode
    ? "STRICT PRODUCT LOCK ACTIVE: Prioritize 100% exact product identity fidelity over creative variation. Do not redesign, do not smooth out logos, do not alter strap/hardware placement, do not alter heel height or sole geometry."
    : "BALANCED MODE: Maintain recognizable product identity with natural photographic adaptation.";

  const ignoreReferenceDesign = preservation.ignoreProductDesignFromReference
    ? "IGNORE PRODUCT DESIGN FROM REFERENCE: Reference images describe ONLY lighting, composition, and background. Do NOT borrow shoes, bags, clothing or geometry from reference images. The uploaded source product is the sole physical subject."
    : "Reference may gently influence aesthetic context without morphing product structure.";

  // 6. Marketplace Preset specs
  const marketplaceSpec = `Marketplace target: ${direction.marketplacePreset.toUpperCase()} framing with aspect ratio ${direction.aspectRatio}. Product scale safe margins respected.`;

  // 7. Reference Strength computation (0 - 100 -> float 0.0 - 1.0)
  const refStrengthNum = Math.max(0, Math.min(100, preservation.referenceStrength ?? 70));
  const refWeight = Number((refStrengthNum / 100).toFixed(2));

  // Reference Style Adapter section
  let referenceStyleSection = "";
  if (referenceAnalysis && refWeight > 0.05) {
    referenceStyleSection = `
[STYLE ADAPTER & REFERENCE GUIDANCE (WEIGHT: ${refWeight} / 1.00)]:
- Photography Reference Style Transfer Active: ${refStrengthNum}% influence
- Key Light Quality: ${referenceAnalysis.lightQuality}
- Lighting Direction: ${referenceAnalysis.lightingDirection}
- Color Temperature & Tone: ${referenceAnalysis.colorTemperature}
- Studio Environment Background: ${referenceAnalysis.backgroundStyle}
- Ground Shadow Characteristic: ${referenceAnalysis.shadowType}
- Framing & Optical Composition: ${referenceAnalysis.framingComposition}
- Atmosphere & Mood: ${referenceAnalysis.mood}
- INSTRUCTION: Apply the photographic lighting setup, tonal curve, and aesthetic mood of the reference at ${refStrengthNum}% intensity to illuminate the scene, without altering the product's physical identity.`;
  } else {
    referenceStyleSection = `
[COMMERCIAL STUDIO LIGHTING SETUP (WEIGHT: ${refWeight} / 1.00)]:
- Key Light: Cinematic 5000K daylight-balanced softbox positioned 45° camera left
- Fill Light: Gentle diffuse ambient bounce reducing harsh dark pockets to natural catalog ratio (3:1)
- Rim / Kicker: High-precision edge highlight contouring the product silhouette and separating it from the background
- Shadow Architecture: Physically grounded raytraced contact shadow, ambient occlusion crease where product contacts ground plane, and soft diffuse penumbra falloff.`;
  }

  // 8. Calculate diffusion parameters for image-to-image & diffusion models
  // Range: 0.65 - 0.80 as requested
  const baseDenoising = preservation.strictProductMode ? 0.70 : 0.76;
  const detailOffset = (100 - (preservation.detailPreservation ?? 100)) * 0.0008;
  const denoisingStrength = Number(Math.min(0.80, Math.max(0.65, baseDenoising + detailOffset)).toFixed(2));
  const guidanceScale = 7.5;
  const controlnetStrength = preservation.strictProductMode ? 0.90 : 0.75;

  // Final Assembly
  const systemPrompt = `You are VELLUM AI Agent, an elite Commercial Product Photography Director.
PHILOSOPHY: PRODUCT = LOCKED | ENVIRONMENT & PHOTOGRAPHY = GENERATIVE RE-RENDER.
DO NOT just paste the original image. You MUST generate a completely new commercial photography studio environment, with dramatic professional lighting, raytraced shadows, and high-end set design, while strictly maintaining the geometric shape, color, and texture of the main product.
The uploaded product images are the authoritative physical ground truth. Preserve geometry, proportions, components, colors, materials, textures, logos, stitching, ornaments, and construction exactly when those attributes are locked.
Do not perform a basic 2D cut-and-paste, sticker overlay, or flat background swap. Re-render the entire visual environment around the product with realistic 3D diffusion depth, volumetric studio lighting, global illumination, raytraced ambient occlusion, and authentic physics-based contact shadows.`;

  const generationPrompt = `[COMMERCIAL STUDIO PRODUCT PHOTOGRAPHY]
MANDATORY DIRECTIVE: DO NOT just paste the original image. You MUST generate a completely new commercial photography studio environment, with dramatic professional lighting, raytraced shadows, and high-end set design, while strictly maintaining the geometric shape, color, and texture of the main product.

=== 1. AUTHORITATIVE SUBJECT: PHYSICAL PRODUCT (LOCKED GEOMETRY) ===
- Category: ${blueprint.category} (${blueprint.subcategory || blueprint.shape})
- Silhouette & Shape: ${blueprint.shape}
- Primary Material & Finish: ${blueprint.material}
- Color Specification: ${blueprint.color}
- Surface Texture & Grain: ${blueprint.texture}
- Physical Proportions: ${blueprint.proportions}
- Construction & Assembly: ${blueprint.construction}
- LOCKED ATTRIBUTES SPECIFICATIONS:
  * ${lockedFeatures.join("\n  * ")}
- SUBJECT LOCK DIRECTIVE: Preserve exact physical identity, contours, brand logos, strap/buckle geometry, and material sheen. Zero deformation or morphological drift.

=== 2. GENERATIVE ENVIRONMENT & STUDIO SET DESIGN (RE-RENDER) ===
- Studio Environment: ${backgroundDesc}
- Staging & Set Design: Premium commercial studio staging, professional product riser/pedestal, pristine surface finish with micro-reflections.
- Camera Perspective: ${angleDirective}
- Model Presence & Placement: ${modelDirective}
- Target Marketplace: ${marketplaceSpec}

=== 3. LIGHTING ARCHITECTURE & SHADOW PHYSICS ===
${referenceStyleSection}
- MANDATORY CONTACT SHADOW DIRECTIVE: Seamlessly integrate the product into the environment. Generate highly realistic raytraced contact shadows directly underneath the product based on the new lighting direction. No floating products.

=== 4. DIFFUSION ENGINE DIRECTIVES ===
- Inpainting & Environment Synthesis: Seamlessly integrate the product into the environment. Generate highly realistic raytraced contact shadows directly underneath the product based on the new lighting direction. No floating products.
- Denoising Space: Re-render background, lighting, and ambient light bounce with high diffusion latitude (${denoisingStrength} denoising strength) while locking product structure.
- Reference Direction Strength: ${refStrengthNum}/100 (${refWeight})
- Detail Preservation Level: ${preservation.detailPreservation}/100
- Rendering Fidelity: Authentic 8K commercial catalog resolution, Hasselblad medium format optical sharpness, photorealistic global illumination, physically accurate raytraced contact shadows.
${strictEnforcement}
${ignoreReferenceDesign}`;

  const negativePrompt = `flat 2d cutout, copy pasted product, sticker effect, floating product, missing contact shadows, no ambient occlusion, harsh cutout borders, amateur snapshot, distorted product geometry, altered logo, deformed heel, wrong sole, morphed shape, extra straps, missing buckle, distorted proportions, low resolution, blurry texture, generic product replacement, synthetic artifacts, warped lines, wrong color, redesigned silhouette, oversaturated CGI`;

  return {
    systemPrompt,
    generationPrompt,
    negativePrompt,
    diffusionParams: {
      denoisingStrength,
      guidanceScale,
      referenceStrength: refWeight,
      controlnetStrength,
      styleWeight: refWeight,
    },
    structuredDirectives: {
      category: blueprint.category,
      lockedAttributes: lockedFeatures,
      cameraAngle: angleDirective,
      background: backgroundDesc,
      model: modelDirective,
      aspectRatio: direction.aspectRatio,
      strictMode: preservation.strictProductMode,
      detailPreservation: preservation.detailPreservation,
      referenceStrength: preservation.referenceStrength,
      denoisingStrength,
      guidanceScale,
      controlnetStrength,
      styleWeight: refWeight,
    },
  };
}

export interface PlatePromptOutput {
  platePrompt: string;
  negativePrompt: string;
  aspectRatio: string;
}

/**
 * Builds an authoritative text-to-image prompt for the "Plate + Composite" pipeline.
 *
 * Rules:
 * 1. Generates ONLY an empty background studio plate (no product, no objects).
 * 2. Prompt MUST contain: "empty studio scene, no product, no objects on the surface, clear flat surface in the lower center".
 * 3. Never sends "product lock", category names, or product specifications.
 */
export function buildBackgroundPlatePrompt(params: {
  direction: PhotographyDirection;
  referenceAnalysis?: ReferenceAnalysis;
  variationIndex?: number;
}): PlatePromptOutput {
  const { direction, referenceAnalysis, variationIndex = 0 } = params;

  let bgSetting = "warm neutral luxury beige commercial studio podium, subtle soft diffuse gradient";

  // Prioritize reference analysis whenever reference is provided and background isn't explicitly set to pure white or transparent
  if (referenceAnalysis && direction.background !== "studio_white" && direction.background !== "transparent") {
    bgSetting = `commercial photography set matching reference environment: ${referenceAnalysis.backgroundStyle}, lighting direction: ${referenceAnalysis.lightingDirection}, light quality: ${referenceAnalysis.lightQuality || "soft diffuse"}, mood: ${referenceAnalysis.mood || "commercial"}`;
  } else if (direction.background === "studio_beige") {
    bgSetting = "warm luxury neutral beige matte commercial studio podium, soft diffuse ambient gradient, architectural podium surface";
  } else if (direction.background === "studio_white") {
    bgSetting = "pure seamless high-key commercial white studio cyclorama with gentle soft ground lighting gradient";
  } else if (direction.background === "lifestyle") {
    bgSetting = "luxurious architectural limestone interior podium with soft morning daylight, subtle minimalist background depth of field";
  } else if (direction.background === "gradient") {
    bgSetting = "subtle warm amber-to-slate smooth studio backdrop gradient on a polished podium surface";
  } else if (direction.background === "transparent") {
    bgSetting = "clean neutral commercial studio surface with subtle soft ground gradient";
  } else if (direction.background === "exact_reference" && referenceAnalysis) {
    bgSetting = `commercial photography set: ${referenceAnalysis.backgroundStyle}, ${referenceAnalysis.lightingDirection}, ${referenceAnalysis.shadowType}`;
  } else if (direction.background === "custom" && direction.customBackground) {
    bgSetting = direction.customBackground;
  }

  const angleMap: Record<string, string> = {
    front: "straight-on front eye-level commercial studio perspective",
    three_quarter: "hero three-quarter perspective studio view",
    side: "clean horizontal side profile elevation view",
    top: "overhead 90-degree top-down flatlay perspective",
    low_angle: "dramatic dynamic low-angle upward hero elevation",
    high_angle: "elevated 45-degree high-angle studio perspective",
  };
  let angleText = angleMap[direction.cameraAngle];
  if (!angleText || direction.cameraAngle === "copy_reference") {
    if (referenceAnalysis?.framingComposition) {
      angleText = `${referenceAnalysis.framingComposition}, perspective matching reference lighting and elevation`;
    } else {
      const varied = [
        "hero three-quarter perspective studio view",
        "straight-on front eye-level commercial studio perspective",
        "dramatic dynamic low-angle upward hero elevation",
        "overhead 45-degree top-down flatlay perspective",
      ];
      angleText = varied[variationIndex % varied.length];
    }
  }

  // Mandatory requirement: "empty studio scene, no product, no objects on the surface, clear flat surface in the lower center"
  const platePrompt = `empty studio scene, no product, no objects on the surface, clear flat surface in the lower center. Professional commercial studio photography environment, ${bgSetting}, ${angleText}, Hasselblad medium format optical sharpness, photorealistic global illumination, cinematic softbox lighting, pristine clean empty stage ready for product staging.`;

  const negativePrompt = `product, shoes, footwear, sneakers, heels, boots, bag, handbag, clothing, apparel, person, people, human, model, man, woman, feet, hands, objects on table, clutter, text, watermark, logo, deformed, blurry, noisy`;

  return {
    platePrompt,
    negativePrompt,
    aspectRatio: direction.aspectRatio || "1:1",
  };
}
