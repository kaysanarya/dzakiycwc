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

// High-resolution realistic demo photographic assets stored as reliable data URLs/SVGs with luxury studio look
export const DEMO_SOURCE_IMAGES: UploadedImage[] = [
  {
    id: "src-1",
    name: "mule-hero-three-quarter.png",
    dataUrl: "/demo/footwear-hero.svg",
    size: 2450000,
    type: "image/svg+xml",
    tag: "front",
    width: 1200,
    height: 1200,
  },
  {
    id: "src-2",
    name: "mule-side-profile-heel.png",
    dataUrl: "/demo/footwear-side.svg",
    size: 2180000,
    type: "image/svg+xml",
    tag: "side",
    width: 1200,
    height: 1200,
  },
  {
    id: "src-3",
    name: "mule-hardware-macro.png",
    dataUrl: "/demo/footwear-macro.svg",
    size: 1940000,
    type: "image/svg+xml",
    tag: "buckle",
    width: 1200,
    height: 1200,
  },
];

export const DEMO_REFERENCE_IMAGES: UploadedImage[] = [
  {
    id: "ref-1",
    name: "editorial-lighting-reference.png",
    dataUrl: "/demo/reference-studio.svg",
    size: 1820000,
    type: "image/svg+xml",
    tag: "general",
    width: 1200,
    height: 1200,
  },
];

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
  score: null,
  status: "unverified",
  checks: {},
  notes: [
    "Square chisel-toe silhouette faithfully maintained with zero morphing (Simulated Demo).",
    "85mm hourglass flared heel height, angle, and thickness confirmed within ±1.5% tolerance.",
    "Champagne gold dual-arch buckle preserved in position and metallic finish.",
    "Natural nappa micro-pebble texture correctly rendered under studio lighting.",
  ],
  validatedAt: new Date().toISOString(),
  isFallback: true,
};

export const DEMO_OUTPUTS: GeneratedOutput[] = [
  {
    id: "out-1",
    imageUrl: "/demo/gen-hero-podium.svg",
    prompt: "Commercial luxury studio photography of Ivory Sculpted Heeled Mule on warm limestone podium, soft 45° key light, razor sharp contact shadow, square chisel toe locked, 85mm hourglass heel locked, champagne gold buckle locked.",
    angle: "Hero 3/4 Front Perspective",
    consistencyScore: null,
    validation: {
      score: null,
      status: "unverified",
      checks: {},
      notes: ["Near-identical silhouette and heel curve (Demo Asset)", "Buckle luster matches raw reference", "Toe shape accurately preserved"],
      validatedAt: new Date().toISOString(),
      isFallback: true,
    },
    status: "passed",
    createdAt: new Date().toISOString(),
    aspectRatio: "1:1",
    degraded: true,
    method: "demo",
  },
  {
    id: "out-2",
    imageUrl: "/demo/gen-side-profile.svg",
    prompt: "Side profile catalog photography of Ivory Sculpted Heeled Mule, showcasing precise 85mm architectural flared block heel, beveled sole edge, warm beige seamless backdrop, diffuse daylight illumination.",
    angle: "Lateral Side Profile View",
    consistencyScore: null,
    validation: {
      score: null,
      status: "unverified",
      checks: {},
      notes: ["Heel slope verified at 88° (Demo Asset)", "Front sole thickness preserved at 6mm"],
      validatedAt: new Date().toISOString(),
      isFallback: true,
    },
    status: "passed",
    createdAt: new Date().toISOString(),
    aspectRatio: "1:1",
    degraded: true,
    method: "demo",
  },
  {
    id: "out-3",
    imageUrl: "/demo/gen-editorial-model.svg",
    prompt: "High-end editorial fashion photography of model wearing Ivory Sculpted Heeled Mule, mid-step on polished travertine floor, flowing cream linen trousers cropped at ankle, natural studio sunlight.",
    angle: "Low Angle In-Context Elevation",
    consistencyScore: null,
    validation: {
      score: null,
      status: "unverified",
      checks: {},
      notes: ["Model framing does not occlude hardware (Demo Asset)", "Strap curvature natural around instep"],
      validatedAt: new Date().toISOString(),
      isFallback: true,
    },
    status: "passed",
    createdAt: new Date().toISOString(),
    aspectRatio: "1:1",
    degraded: true,
    method: "demo",
  },
  {
    id: "out-4",
    imageUrl: "/demo/gen-overhead-macro.svg",
    prompt: "Macro top-down detail photography focusing on champagne gold organic buckle and precision 2.5mm ecru perimeter stitching on Ivory Nappa Mule footbed, warm neutral ambient illumination.",
    angle: "Macro Detail & Hardware Focus",
    consistencyScore: null,
    validation: {
      score: null,
      status: "unverified",
      checks: {},
      notes: ["Gold foil insole emblem visible and centered (Demo Asset)", "Stitching gauge preserved"],
      validatedAt: new Date().toISOString(),
      isFallback: true,
    },
    status: "passed",
    createdAt: new Date().toISOString(),
    aspectRatio: "1:1",
    degraded: true,
    method: "demo",
  },
];
