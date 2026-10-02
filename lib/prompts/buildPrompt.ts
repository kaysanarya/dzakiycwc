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

export function buildStructuredPrompt(params: PromptBuildParams): {
  systemPrompt: string;
  generationPrompt: string;
  negativePrompt: string;
  structuredDirectives: Record<string, unknown>;
} {
  const { blueprint, locks, direction, preservation, referenceAnalysis, variationIndex = 0 } = params;

  // 1. Locked attributes compilation
  const lockedFeatures: string[] = [];
  if (locks.lockShape) lockedFeatures.push(`SHAPE & SILHOUETTE: ${blueprint.shape}`);
  if (locks.lockColor) lockedFeatures.push(`COLOR SPECIFICATION: ${blueprint.color}`);
  if (locks.lockMaterial) lockedFeatures.push(`PRIMARY MATERIAL: ${blueprint.material}`);
  if (locks.lockTexture) lockedFeatures.push(`SURFACE TEXTURE: ${blueprint.texture}`);
  if (locks.lockProportion) lockedFeatures.push(`PROPORTIONS: ${blueprint.proportions}`);
  if (locks.lockConstruction) lockedFeatures.push(`CONSTRUCTION: ${blueprint.construction}`);

  if (blueprint.components && blueprint.components.length > 0) {
    if (locks.lockStrap) lockedFeatures.push(`STRAPS: ${blueprint.components.filter(c => c.toLowerCase().includes("strap")).join(", ") || "Identical to original"}`);
    if (locks.lockBuckle) lockedFeatures.push(`BUCKLE/HARDWARE: ${blueprint.hardware?.finish || "Identical to original"}`);
    if (locks.lockOrnament) lockedFeatures.push(`ORNAMENTS/ACCENTS: ${blueprint.ornaments?.join(", ") || "None/Preserve exactly"}`);
  }

  if (blueprint.logo?.presence && locks.lockLogo) {
    lockedFeatures.push(`LOGO PLACEMENT & STYLE: ${blueprint.logo.style || "Exact branding preserved"} at ${blueprint.logo.placement || "original position"}`);
  }

  if (blueprint.stitching && locks.lockStitching) {
    lockedFeatures.push(`STITCHING DETAILS: ${blueprint.stitching.pattern || "Original stitching"} (${blueprint.stitching.color || "Matching original"})`);
  }

  if (blueprint.category === "footwear") {
    if (locks.lockOutsole && blueprint.outsole) {
      lockedFeatures.push(`OUTSOLE: ${blueprint.outsole.material || "Identical sole"} profile: ${blueprint.outsole.profile || "exact"}`);
    }
    if (blueprint.heel) {
      if (locks.lockHeelHeight && blueprint.heel.heelHeight) lockedFeatures.push(`HEEL HEIGHT: exact ${blueprint.heel.heelHeight}`);
      if (locks.lockHeelShape && blueprint.heel.heelShape) lockedFeatures.push(`HEEL SHAPE & PROFILE: exact ${blueprint.heel.heelShape}`);
      if (locks.lockHeelAngle && blueprint.heel.heelAngle) lockedFeatures.push(`HEEL ANGLE: ${blueprint.heel.heelAngle}`);
      if (locks.lockHeelPosition && blueprint.heel.heelPosition) lockedFeatures.push(`HEEL PLACEMENT: ${blueprint.heel.heelPosition}`);
      if (locks.lockFrontSoleThickness && blueprint.heel.frontSoleThickness) lockedFeatures.push(`FRONT SOLE THICKNESS: ${blueprint.heel.frontSoleThickness}`);
    }
  }

  // 2. Camera Angle logic with subtle angle variations for multi-image batches
  let angleDirective: string = direction.cameraAngle;
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
  if (direction.background === "studio_beige") {
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

  // Final Assembly
  const systemPrompt = `You are VELLUM AI Agent, an elite Product Photography Director.
PHILOSOPHY: PRODUCT = LOCKED | PHOTOGRAPHY = GENERATIVE.
The uploaded product images are the authoritative source of truth for product identity. Do not redesign, reinterpret, beautify, simplify, replace, merge, or invent product features. Preserve geometry, proportions, components, colors, materials, textures, logos, stitching, ornaments, and construction exactly when those attributes are locked. Reference images may influence photography direction only when product-design borrowing is disabled.
Your mission is to direct commercial-grade product photography that makes products look ready for high-end retail, luxury ecommerce, and global advertising.
Crucially: You modify lighting, shadows, camera angles, backgrounds, and framing, but NEVER alter the physical geometry or identity of the original product.`;

  const generationPrompt = `[COMMERCIAL PRODUCT PHOTOGRAPHY]
SUBJECT: Authentic ${blueprint.category} (${blueprint.shape}), material: ${blueprint.material}, color: ${blueprint.color}.
VISUAL SPECIFICATIONS:
- ${lockedFeatures.join("\n- ")}

PHOTOGRAPHY DIRECTION:
- Camera Angle: ${angleDirective}
- Environment / Background: ${backgroundDesc}
- Model Presence: ${modelDirective}
- Lighting: ${referenceAnalysis?.lightingDirection || "Cinematic 3-point softbox studio lighting with razor-sharp rim highlights"}
- Detail Preservation Level: ${preservation.detailPreservation}/100
- Reference Direction Strength: ${preservation.referenceStrength}/100
- ${marketplaceSpec}

STRICT CONSTRAINTS:
${strictEnforcement}
${ignoreReferenceDesign}
Capture authentic micro-textures, true-to-life reflections, and physically accurate contact shadows. 8k resolution, razor sharp optical focus, commercial catalog grade.`;

  const negativePrompt = `deformed product, altered logo, changed heel height, wrong sole, morphed shape, extra straps, missing buckle, distorted proportions, low resolution, blurry texture, generic product replacement, synthetic artifacts, warped lines, wrong color, redesigned silhouette`;

  return {
    systemPrompt,
    generationPrompt,
    negativePrompt,
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
    },
  };
}
