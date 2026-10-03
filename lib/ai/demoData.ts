import {
  ProductBlueprint,
  UploadedImage,
  GeneratedOutput,
  ReferenceAnalysis,
  ValidationResult,
} from "@/types";

export const DEMO_FOOTWEAR_BLUEPRINT: ProductBlueprint = {
  category: "footwear",
  subcategory: "Luxury Sculpted Heeled Mule",
  shape: "Square chisel-toe silhouette with architectural asymmetrical vamp strap and open counter",
  dimensions: "Approx. length 25.5cm, ball width 8.8cm, heel elevation 85mm",
  proportions: "Balanced mid-to-high arch curve with 85mm elevation and 12mm front sole bevel",
  material: "Buttery soft Italian nappa calf leather with subtle natural grain",
  color: "Warm Ivory Cream (#F4EFEA) with polished champagne gold accents",
  texture: "Smooth semi-matte micro-pebble leather with delicate sheen",
  components: [
    "Wide asymmetrical front vamp band",
    "Secondary arch stabilizer strap",
    "Champagne gold dual-arch organic buckle",
    "Sculpted flared block heel",
    "Beveled edge cushioned footbed",
    "Hand-painted tonal burnished edge dye"
  ],
  logo: {
    presence: true,
    placement: "Gold foil debossed signature beneath cushioned insole arch",
    style: "Minimalist serif wordmark with sub-line origin stamp",
    description: "Subtle 12pt metallic gold hot-stamped emblem"
  },
  stitching: {
    pattern: "Precision single-needle edge perimeter stitching with 2.5mm pitch",
    color: "Tone-on-tone ecru linen thread",
    contrast: false
  },
  ornaments: [
    "Polished champagne gold hardware buckle on lateral arch",
    "Sculptural heel base architectural notch"
  ],
  hardware: {
    type: "Organic cast alloy buckle",
    finish: "Micro-brushed satin champagne gold",
    color: "#E2C48E"
  },
  outsole: {
    material: "Natural vegetable-tanned hard leather sole with anti-slip rubber forefoot inlay",
    color: "Caramel honey leather (#C89D66)",
    profile: "Slim 4mm beveled dress sole with channeled edge",
    pattern: "Fine debossed diamond traction grid on forefoot"
  },
  heel: {
    heelHeight: "85mm (3.35 inches)",
    heelWidth: "42mm at crown tapering to 34mm waist and 48mm architectural flare at base",
    heelAngle: "88° structural pitch relative to ground plane",
    heelPosition: "Directly centered below calcaneus strike axis",
    heelShape: "Hourglass flared block with concave medial curve and straight lateral facet",
    heelThickness: "Substantial architectural block profile",
    frontSoleThickness: "6mm leather welt with 2mm flush rubber inlay",
    outsolePattern: "Debossed herringbone traction island on heel tip"
  },
  construction: "Blake-stitched wrapped heel construction with reinforced steel shank",
  visualNotes: "Distinctive flared architectural heel requires rigid preservation. Do not morph the toe from square to pointed.",
  confidence: 0.98
};

// Realistic demo assets placeholder — procedural pipeline runs on authentic user uploads
export const DEMO_SOURCE_IMAGES: UploadedImage[] = [];

export const DEMO_REFERENCE_IMAGES: UploadedImage[] = [];

export const DEMO_REFERENCE_ANALYSIS: ReferenceAnalysis = {
  lightingDirection: "Key light 45° camera-left diffused through 1.2m silk scrim, fill reflector at 30° right",
  lightQuality: "Ultra-soft graduated falloff with micro-specular rim highlight along the upper leather ridge",
  colorTemperature: "4800K neutral daylight with gentle warm golden undertones",
  backgroundStyle: "Minimalist warm travertine limestone podium on warm cream plaster backdrop",
  shadowType: "Contact grounding occlusion shadow with soft graduated ambient cast to the right",
  framingComposition: "Clean central subject isolation with golden ratio negative space",
  mood: "Quiet luxury, architectural elegance, high-end department store campaign",
};

export const DEMO_VALIDATION_PERFECT: ValidationResult = {
  score: 92,
  status: "pass",
  checks: {
    shape: 95,
    proportions: 90,
  },
  notes: [
    "Demo — latar prosedural, bukan hasil AI generatif",
  ],
  validatedAt: new Date().toISOString(),
  isFallback: true,
};

export const DEMO_OUTPUTS: GeneratedOutput[] = [];
