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

// Realistic authentic demo assets
const DEMO_SHOE_RAW_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'><rect width='800' height='800' fill='%2318181b'/><g transform='translate(150, 220)'><path d='M80,340 C140,340 220,310 270,250 C320,190 350,170 410,165 C440,165 470,185 480,210 C460,230 400,240 330,260 C260,280 180,350 80,350 Z' fill='%23e8decb' stroke='%23d4c6af' stroke-width='4'/><path d='M420,165 C450,165 475,185 475,210 L450,345 C440,360 415,360 410,345 L415,220 Z' fill='%23d4c6af' stroke='%23b8a68b' stroke-width='3'/><circle cx='340' cy='230' r='16' fill='none' stroke='%23d4af37' stroke-width='4'/><rect x='80' y='345' width='160' height='12' rx='6' fill='%23a89178'/><text x='250' y='420' fill='%23a1a1aa' font-size='16' font-family='sans-serif' text-anchor='middle'>FOTO MENTAH (RAW SOURCE)</text></g></svg>";

const DEMO_STUDIO_AI_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'><defs><linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23ede6d8'/><stop offset='100%' stop-color='%23d6caa8'/></linearGradient><radialGradient id='shadow' cx='50%' cy='50%' r='50%'><stop offset='0%' stop-color='%235c5240' stop-opacity='0.4'/><stop offset='100%' stop-color='%235c5240' stop-opacity='0'/></radialGradient></defs><rect width='800' height='800' fill='url(%23bg)'/><ellipse cx='400' cy='580' rx='280' ry='50' fill='url(%23shadow)'/><ellipse cx='400' cy='560' rx='260' ry='40' fill='%23f5efe6' stroke='%23e0d4c1' stroke-width='2'/><g transform='translate(150, 210)'><path d='M80,340 C140,340 220,310 270,250 C320,190 350,170 410,165 C440,165 470,185 480,210 C460,230 400,240 330,260 C260,280 180,350 80,350 Z' fill='%23f9f6f0' stroke='%23e8decb' stroke-width='3'/><path d='M420,165 C450,165 475,185 475,210 L450,345 C440,360 415,360 410,345 L415,220 Z' fill='%23e3d7c3' stroke='%23c9ba9f' stroke-width='2'/><circle cx='340' cy='230' r='16' fill='none' stroke='%23d4af37' stroke-width='5'/><rect x='80' y='345' width='160' height='12' rx='6' fill='%23c89d66'/></g><rect x='30' y='30' width='110' height='26' rx='6' fill='%23064e3b' fill-opacity='0.9'/><text x='85' y='48' fill='%236ee7b7' font-size='12' font-family='sans-serif' font-weight='bold' text-anchor='middle'>HASIL AI • 94%</text></svg>";

const DEMO_STUDIO_AI_VAR2 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'><defs><linearGradient id='bg2' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%23ffffff'/><stop offset='100%' stop-color='%23f0ece1'/></linearGradient><radialGradient id='shadow2' cx='50%' cy='50%' r='50%'><stop offset='0%' stop-color='%23000000' stop-opacity='0.25'/><stop offset='100%' stop-color='%23000000' stop-opacity='0'/></radialGradient></defs><rect width='800' height='800' fill='url(%23bg2)'/><ellipse cx='400' cy='580' rx='260' ry='45' fill='url(%23shadow2)'/><g transform='translate(150, 210)'><path d='M80,340 C140,340 220,310 270,250 C320,190 350,170 410,165 C440,165 470,185 480,210 C460,230 400,240 330,260 C260,280 180,350 80,350 Z' fill='%23ffffff' stroke='%23e4e4e7' stroke-width='3'/><path d='M420,165 C450,165 475,185 475,210 L450,345 C440,360 415,360 410,345 L415,220 Z' fill='%23f4f4f5' stroke='%23d4d4d8' stroke-width='2'/><circle cx='340' cy='230' r='16' fill='none' stroke='%23d4af37' stroke-width='5'/><rect x='80' y='345' width='160' height='12' rx='6' fill='%23a1a1aa'/></g><rect x='30' y='30' width='110' height='26' rx='6' fill='%23064e3b' fill-opacity='0.9'/><text x='85' y='48' fill='%236ee7b7' font-size='12' font-family='sans-serif' font-weight='bold' text-anchor='middle'>HASIL AI • 92%</text></svg>";

export const DEMO_SOURCE_IMAGES: UploadedImage[] = [
  {
    id: "demo-heels-01",
    name: "luxury-heeled-mule-raw.png",
    dataUrl: DEMO_SHOE_RAW_SVG,
    size: 245800,
    type: "image/svg+xml",
    width: 800,
    height: 800,
    tag: "front",
  },
];

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
  score: 94,
  status: "pass",
  checks: {
    shape: 96,
    proportions: 92,
  },
  notes: [
    "Hasil studio terverifikasi: proporsi bentuk dan hak sepatu 100% identik dengan produk asli",
  ],
  validatedAt: new Date().toISOString(),
  isFallback: false,
};

export const DEMO_OUTPUTS: GeneratedOutput[] = [
  {
    id: "demo-out-1",
    imageUrl: DEMO_STUDIO_AI_SVG,
    thumbnailUrl: DEMO_STUDIO_AI_SVG,
    prompt: "Commercial luxury footwear on neutral warm travertine podium, studio soft diffused lighting",
    createdAt: new Date().toISOString(),
    status: "passed",
    angle: "front",
    consistencyScore: 94,
    validation: DEMO_VALIDATION_PERFECT,
    method: "hybrid-composite",
    aspectRatio: "1:1",
    degraded: false,
  },
  {
    id: "demo-out-2",
    imageUrl: DEMO_STUDIO_AI_VAR2,
    thumbnailUrl: DEMO_STUDIO_AI_VAR2,
    prompt: "Commercial footwear on white minimal podium, high-key studio soft light",
    createdAt: new Date().toISOString(),
    status: "passed",
    angle: "three_quarter",
    consistencyScore: 92,
    validation: {
      ...DEMO_VALIDATION_PERFECT,
      score: 92,
    },
    method: "hybrid-composite",
    aspectRatio: "1:1",
    degraded: false,
  },
];
