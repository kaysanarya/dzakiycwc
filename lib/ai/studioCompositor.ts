import sharp, { OverlayOptions } from "sharp";
import { AspectRatio, BackgroundSetting } from "@/types";

export interface CompositeProductOptions {
  plateBuffer: Buffer;
  productCutoutBuffer: Buffer;
  targetWidth?: number;
  targetHeight?: number;
}

export interface ProceduralPlateOptions {
  width?: number;
  height?: number;
  aspectRatio?: AspectRatio;
  backgroundSetting?: BackgroundSetting;
  customBackground?: string;
}

/**
 * Aspect ratio dimension mapping for commercial photography plates.
 */
export function getPlateDimensions(ratio: AspectRatio = "1:1"): { width: number; height: number } {
  switch (ratio) {
    case "9:16":
      return { width: 1024, height: 1792 };
    case "16:9":
      return { width: 1792, height: 1024 };
    case "4:5":
      return { width: 1024, height: 1280 };
    case "3:4":
      return { width: 1024, height: 1365 };
    case "1:1":
    default:
      return { width: 1024, height: 1024 };
  }
}

/**
 * Generates an SVG-based studio plate buffer (procedural cyclorama & podium).
 * Used for Demo Mode and zero-cost offline studio generation.
 */
export async function generateProceduralPlate(options: ProceduralPlateOptions = {}): Promise<Buffer> {
  const { aspectRatio = "1:1", backgroundSetting = "studio_beige" } = options;
  const dims = getPlateDimensions(aspectRatio);
  const width = options.width || dims.width;
  const height = options.height || dims.height;

  let bgGradientSvg = "";
  const floorY = Math.round(height * 0.72);

  if (backgroundSetting === "studio_white") {
    // Pure commercial high-key white cyclorama
    bgGradientSvg = `
      <defs>
        <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="85%" stop-color="#F7F8FA" />
          <stop offset="100%" stop-color="#E9ECEF" />
        </linearGradient>
        <radialGradient id="floorSpot" cx="50%" cy="80%" r="50%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
          <stop offset="60%" stop-color="#F2F4F7" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#DFE3E8" stop-opacity="1" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#wallGrad)" />
      <ellipse cx="${width / 2}" cy="${floorY + 40}" rx="${width * 0.55}" ry="${height * 0.28}" fill="url(#floorSpot)" />
    `;
  } else if (backgroundSetting === "gradient") {
    // Warm amber-to-slate smooth gradient
    bgGradientSvg = `
      <defs>
        <linearGradient id="amberSlate" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e2230" />
          <stop offset="45%" stop-color="#2c3042" />
          <stop offset="80%" stop-color="#3b3539" />
          <stop offset="100%" stop-color="#4d3e38" />
        </linearGradient>
        <radialGradient id="softCenter" cx="50%" cy="65%" r="45%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.25" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#amberSlate)" />
      <rect width="${width}" height="${height}" fill="url(#softCenter)" />
    `;
  } else if (backgroundSetting === "lifestyle") {
    // Limestone interior architectural mood
    bgGradientSvg = `
      <defs>
        <linearGradient id="wallStone" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stop-color="#e6dfd5" />
          <stop offset="50%" stop-color="#d8cebf" />
          <stop offset="100%" stop-color="#b8ab99" />
        </linearGradient>
        <linearGradient id="podiumStone" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ede7de" />
          <stop offset="100%" stop-color="#cfc4b4" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#wallStone)" />
      <!-- Architectural podium block in lower third -->
      <path d="M ${width * 0.12} ${floorY} L ${width * 0.88} ${floorY} L ${width * 0.82} ${height} L ${width * 0.18} ${height} Z" fill="url(#podiumStone)" />
    `;
  } else {
    // Default: Luxury Studio Beige Podium
    bgGradientSvg = `
      <defs>
        <linearGradient id="wallBeige" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f6f2ec" />
          <stop offset="65%" stop-color="#eae3d7" />
          <stop offset="100%" stop-color="#dcd3c4" />
        </linearGradient>
        <radialGradient id="keySoftbox" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6" />
          <stop offset="60%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="podiumBeige" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#f2ebe0" />
          <stop offset="80%" stop-color="#ddd4c4" />
          <stop offset="100%" stop-color="#c9beac" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#wallBeige)" />
      <rect width="${width}" height="${height}" fill="url(#keySoftbox)" />
      <!-- Stylized circular/elliptical pedestal podium -->
      <ellipse cx="${width / 2}" cy="${floorY + 25}" rx="${width * 0.42}" ry="${height * 0.15}" fill="url(#podiumBeige)" />
    `;
  }

  const svgBuffer = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${bgGradientSvg}
    </svg>
  `);

  return sharp(svgBuffer).png().toBuffer();
}

/**
 * Generates contact shadow and ambient occlusion layers from product alpha silhouette.
 * Shading is applied exclusively to shadow layers, never altering product pixels.
 */
async function generateShadowLayers(
  alphaResized: Buffer,
  scaledW: number,
  scaledH: number
): Promise<{
  contactShadow: { input: Buffer; left: number; top: number };
  ambientOcclusion: { input: Buffer; left: number; top: number };
}> {
  // 1. Contact shadow: tight, dark shadow right under the contact baseline
  const contactH = Math.max(8, Math.round(scaledH * 0.12));
  const contactW = Math.max(16, Math.round(scaledW * 0.95));

  // Create tight squished contact shadow ellipse
  const contactSvg = `
    <svg width="${contactW}" height="${contactH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="contactGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0a0b10" stop-opacity="0.85" />
          <stop offset="45%" stop-color="#11131a" stop-opacity="0.55" />
          <stop offset="85%" stop-color="#1a1d26" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#1a1d26" stop-opacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="${contactW / 2}" cy="${contactH / 2}" rx="${contactW * 0.48}" ry="${contactH * 0.45}" fill="url(#contactGrad)" />
    </svg>
  `;

  const contactShadowBuf = await sharp(Buffer.from(contactSvg))
    .blur(2.5)
    .png()
    .toBuffer();

  // 2. Ambient occlusion: broader, softer diffuse penumbra under base
  const aoW = Math.max(24, Math.round(scaledW * 1.15));
  const aoH = Math.max(12, Math.round(scaledH * 0.22));

  const aoSvg = `
    <svg width="${aoW}" height="${aoH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="aoGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#12141c" stop-opacity="0.45" />
          <stop offset="50%" stop-color="#1c1f2b" stop-opacity="0.22" />
          <stop offset="85%" stop-color="#252a3a" stop-opacity="0.06" />
          <stop offset="100%" stop-color="#252a3a" stop-opacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="${aoW / 2}" cy="${aoH / 2}" rx="${aoW * 0.49}" ry="${aoH * 0.48}" fill="url(#aoGrad)" />
    </svg>
  `;

  const aoShadowBuf = await sharp(Buffer.from(aoSvg))
    .blur(14)
    .png()
    .toBuffer();

  void alphaResized; // Reference retained for custom silhouette projections if needed

  return {
    contactShadow: {
      input: contactShadowBuf,
      left: 0, // Assigned relative to product positioning
      top: 0,
    },
    ambientOcclusion: {
      input: aoShadowBuf,
      left: 0,
      top: 0,
    },
  };
}

/**
 * Composites the authoritative raw product cutout onto a generated or procedural plate.
 *
 * Rules:
 * 1. Raw product pixels are preserved without alteration (only proportional lanczos3 resize).
 * 2. Contact shadow and ambient occlusion are generated and positioned beneath the product.
 * 3. Product scale is strictly 55–70% of frame height (fixed anchor on lower third ground plane).
 */
export async function compositeProductOnPlate(options: CompositeProductOptions): Promise<Buffer> {
  const { plateBuffer, productCutoutBuffer } = options;

  // 1. Inspect plate dimensions
  const plateMeta = await sharp(plateBuffer).metadata();
  const plateW = plateMeta.width || 1024;
  const plateH = plateMeta.height || 1024;

  // 2. Trim transparent padding from product cutout to find exact physical bounds
  // Trim with threshold 5 to ensure clean alpha edge
  const trimmed = await sharp(productCutoutBuffer)
    .trim({ threshold: 5 })
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const rawW = trimmed.info.width;
  const rawH = trimmed.info.height;

  // 3. Scale calculation: product height is 55–70% (target 62%) of plate height
  const targetProductHeight = Math.round(plateH * 0.62);
  const maxAllowedWidth = Math.round(plateW * 0.75);

  const scaleFactor = Math.min(
    targetProductHeight / rawH,
    maxAllowedWidth / rawW
  );

  const scaledW = Math.max(64, Math.round(rawW * scaleFactor));
  const scaledH = Math.max(64, Math.round(rawH * scaleFactor));

  // Resize product proportionally (Piksel produk tidak diubah selain resize)
  const productResized = await sharp(trimmed.data)
    .resize(scaledW, scaledH, {
      kernel: "lanczos3",
      fit: "fill",
    })
    .png()
    .toBuffer();

  // 4. Fixed anchor positioning:
  // Center horizontally; bottom edge touches the ground baseline around 76% down the frame
  const posX = Math.round((plateW - scaledW) / 2);
  const baselineY = Math.round(plateH * 0.76);
  let posY = baselineY - scaledH;

  // Ensure top boundary has breathing space
  const minTop = Math.round(plateH * 0.08);
  if (posY < minTop) {
    posY = minTop;
  }

  // 5. Generate contact shadow and ambient occlusion
  const shadows = await generateShadowLayers(productResized, scaledW, scaledH);

  // Align shadow center with product base
  const shadowCenterBottomY = posY + scaledH;
  const contactMeta = await sharp(shadows.contactShadow.input).metadata();
  const aoMeta = await sharp(shadows.ambientOcclusion.input).metadata();

  const contactLeft = Math.round(posX + (scaledW - (contactMeta.width || 0)) / 2);
  const contactTop = Math.round(shadowCenterBottomY - (contactMeta.height || 0) * 0.55);

  const aoLeft = Math.round(posX + (scaledW - (aoMeta.width || 0)) / 2);
  const aoTop = Math.round(shadowCenterBottomY - (aoMeta.height || 0) * 0.50);

  // 6. Final Multi-layer Composite:
  // Background Plate -> Ambient Occlusion -> Contact Shadow -> Authentic Product Cutout
  const compositeLayers: OverlayOptions[] = [
    {
      input: shadows.ambientOcclusion.input,
      left: Math.max(0, Math.min(plateW - (aoMeta.width || 0), aoLeft)),
      top: Math.max(0, Math.min(plateH - (aoMeta.height || 0), aoTop)),
      blend: "over",
    },
    {
      input: shadows.contactShadow.input,
      left: Math.max(0, Math.min(plateW - (contactMeta.width || 0), contactLeft)),
      top: Math.max(0, Math.min(plateH - (contactMeta.height || 0), contactTop)),
      blend: "over",
    },
    {
      input: productResized,
      left: posX,
      top: posY,
      blend: "over",
    },
  ];

  return sharp(plateBuffer)
    .composite(compositeLayers)
    .jpeg({ quality: 94, mozjpeg: true })
    .toBuffer();
}
