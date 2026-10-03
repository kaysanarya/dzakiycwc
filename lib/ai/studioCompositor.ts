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
 * Multi-layer shadow system for commercial studio photography realism:
 * 1. Contact shadow (ambient occlusion): dense, thin (0-3px) shadow directly beneath contact points.
 * 2. Directional cast shadow: soft graduated shadow diffused along key light direction.
 * 3. Ambient penumbra: broad natural floor occlusion falloff.
 */
async function generateMultiLayerShadows(
  scaledW: number,
  scaledH: number
): Promise<{
  contactShadow: { input: Buffer; topOffset: number };
  castShadow: { input: Buffer; leftOffset: number; topOffset: number };
  ambientPenumbra: { input: Buffer; topOffset: number };
}> {
  // 1. Contact shadow: ultra-tight, dark grounding band (0–3px perceived height)
  const contactW = Math.max(16, Math.round(scaledW * 0.92));
  const contactH = Math.max(4, Math.round(scaledH * 0.04));

  const contactSvg = `
    <svg width="${contactW}" height="${contactH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="contactG" cx="50%" cy="50%" rx="50%" ry="50%">
          <stop offset="0%" stop-color="#050608" stop-opacity="0.94" />
          <stop offset="60%" stop-color="#0d0f15" stop-opacity="0.75" />
          <stop offset="85%" stop-color="#141720" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#141720" stop-opacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="${contactW / 2}" cy="${contactH / 2}" rx="${contactW * 0.49}" ry="${contactH * 0.45}" fill="url(#contactG)" />
    </svg>
  `;
  const contactShadowBuf = await sharp(Buffer.from(contactSvg))
    .blur(1.2)
    .png()
    .toBuffer();

  // 2. Directional cast shadow: diffused graduated shadow extending softly to the right/front
  const castW = Math.max(24, Math.round(scaledW * 1.15));
  const castH = Math.max(12, Math.round(scaledH * 0.16));

  const castSvg = `
    <svg width="${castW}" height="${castH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="castG" cx="44%" cy="38%" rx="52%" ry="48%">
          <stop offset="0%" stop-color="#0c0e14" stop-opacity="0.55" />
          <stop offset="45%" stop-color="#181a24" stop-opacity="0.28" />
          <stop offset="80%" stop-color="#242734" stop-opacity="0.08" />
          <stop offset="100%" stop-color="#242734" stop-opacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="${castW * 0.52}" cy="${castH * 0.48}" rx="${castW * 0.46}" ry="${castH * 0.44}" fill="url(#castG)" />
    </svg>
  `;
  const castShadowBuf = await sharp(Buffer.from(castSvg))
    .blur(8.5)
    .png()
    .toBuffer();

  // 3. Ambient penumbra: broad soft diffuse light falloff on the studio floor
  const penumbraW = Math.max(32, Math.round(scaledW * 1.35));
  const penumbraH = Math.max(16, Math.round(scaledH * 0.28));

  const penumbraSvg = `
    <svg width="${penumbraW}" height="${penumbraH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="penumbraG" cx="50%" cy="50%" rx="50%" ry="50%">
          <stop offset="0%" stop-color="#141720" stop-opacity="0.25" />
          <stop offset="50%" stop-color="#1a1d28" stop-opacity="0.12" />
          <stop offset="85%" stop-color="#242734" stop-opacity="0.03" />
          <stop offset="100%" stop-color="#242734" stop-opacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="${penumbraW / 2}" cy="${penumbraH / 2}" rx="${penumbraW * 0.48}" ry="${penumbraH * 0.47}" fill="url(#penumbraG)" />
    </svg>
  `;
  const penumbraBuf = await sharp(Buffer.from(penumbraSvg))
    .blur(18)
    .png()
    .toBuffer();

  return {
    contactShadow: {
      input: contactShadowBuf,
      topOffset: -Math.round(contactH * 0.5),
    },
    castShadow: {
      input: castShadowBuf,
      leftOffset: Math.round(scaledW * 0.05),
      topOffset: -Math.round(castH * 0.25),
    },
    ambientPenumbra: {
      input: penumbraBuf,
      topOffset: -Math.round(penumbraH * 0.35),
    },
  };
}

/**
 * Applies subtle warm studio ambient color bounce to lower edge of product.
 * Mimics physical light bounce from beige travertine / warm floor podium.
 */
async function applyAmbientColorBounce(
  productBuffer: Buffer,
  scaledW: number,
  scaledH: number
): Promise<Buffer> {
  const bounceSvg = `
    <svg width="${scaledW}" height="${scaledH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bounceGrad" x1="0%" y1="100%" x2="0%" y2="70%">
          <stop offset="0%" stop-color="#d8cebf" stop-opacity="0.30" />
          <stop offset="50%" stop-color="#e8decb" stop-opacity="0.12" />
          <stop offset="100%" stop-color="#e8decb" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      <rect width="${scaledW}" height="${scaledH}" fill="url(#bounceGrad)" />
    </svg>
  `;

  return sharp(productBuffer)
    .composite([
      {
        input: Buffer.from(bounceSvg),
        blend: "soft-light",
      },
    ])
    .png()
    .toBuffer();
}

/**
 * Composites the authoritative raw product cutout onto a generated or procedural plate.
 *
 * Rules:
 * 1. Raw product pixels are preserved without alteration (only proportional lanczos3 resize + ambient bounce).
 * 2. Multi-layer contact, directional cast, and ambient shadows are positioned beneath the product.
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

  // 5. Apply subtle warm ambient color bounce to ground product into studio scene
  const productIntegrated = await applyAmbientColorBounce(productResized, scaledW, scaledH);

  // 6. Generate multi-layer shadows (Ambient Penumbra -> Cast Shadow -> Contact Shadow)
  const shadows = await generateMultiLayerShadows(scaledW, scaledH);
  const shadowCenterBottomY = posY + scaledH;

  const penumbraMeta = await sharp(shadows.ambientPenumbra.input).metadata();
  const castMeta = await sharp(shadows.castShadow.input).metadata();
  const contactMeta = await sharp(shadows.contactShadow.input).metadata();

  const penumbraLeft = Math.round(posX + (scaledW - (penumbraMeta.width || 0)) / 2);
  const penumbraTop = Math.round(shadowCenterBottomY + shadows.ambientPenumbra.topOffset);

  const castLeft = Math.round(posX + (scaledW - (castMeta.width || 0)) / 2 + shadows.castShadow.leftOffset);
  const castTop = Math.round(shadowCenterBottomY + shadows.castShadow.topOffset);

  const contactLeft = Math.round(posX + (scaledW - (contactMeta.width || 0)) / 2);
  const contactTop = Math.round(shadowCenterBottomY + shadows.contactShadow.topOffset);

  // 7. Final Multi-layer Composite:
  // Background Plate -> Ambient Penumbra -> Directional Cast Shadow -> Contact Occlusion -> Authentic Integrated Product
  const compositeLayers: OverlayOptions[] = [
    {
      input: shadows.ambientPenumbra.input,
      left: Math.max(0, Math.min(plateW - (penumbraMeta.width || 0), penumbraLeft)),
      top: Math.max(0, Math.min(plateH - (penumbraMeta.height || 0), penumbraTop)),
      blend: "over",
    },
    {
      input: shadows.castShadow.input,
      left: Math.max(0, Math.min(plateW - (castMeta.width || 0), castLeft)),
      top: Math.max(0, Math.min(plateH - (castMeta.height || 0), castTop)),
      blend: "over",
    },
    {
      input: shadows.contactShadow.input,
      left: Math.max(0, Math.min(plateW - (contactMeta.width || 0), contactLeft)),
      top: Math.max(0, Math.min(plateH - (contactMeta.height || 0), contactTop)),
      blend: "over",
    },
    {
      input: productIntegrated,
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
