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
  scaledH: number,
  plateW: number,
  plateH: number
): Promise<{
  contactShadow: { input: Buffer; topOffset: number };
  castShadow: { input: Buffer; leftOffset: number; topOffset: number };
  ambientPenumbra: { input: Buffer; topOffset: number };
}> {
  // 1. Contact shadow: ultra-tight, dark grounding band (0–3px perceived height)
  // Strictly bounded to plate dimensions
  const contactW = Math.min(plateW, Math.max(16, Math.round(scaledW * 0.92)));
  const contactH = Math.min(plateH, Math.max(4, Math.round(scaledH * 0.04)));

  const contactSvg = `
    <svg width="${contactW}" height="${contactH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="contactG" cx="50%" cy="50%" rx="50%" ry="50%">
          <stop offset="0%" stop-color="#050608" stop-opacity="0.94" />
          <stop offset="60%" stop-color="#0d0f15" stop-opacity="0.75" />
          <stop offset="85%" stop-color="#141720" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#141720" stop-opacity="0.0" />
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
  // Strictly bounded to plate dimensions
  const castW = Math.min(plateW, Math.max(24, Math.round(scaledW * 1.15)));
  const castH = Math.min(plateH, Math.max(12, Math.round(scaledH * 0.16)));

  const castSvg = `
    <svg width="${castW}" height="${castH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="castG" cx="44%" cy="38%" rx="52%" ry="48%">
          <stop offset="0%" stop-color="#0c0e14" stop-opacity="0.55" />
          <stop offset="45%" stop-color="#181a24" stop-opacity="0.28" />
          <stop offset="80%" stop-color="#242734" stop-opacity="0.08" />
          <stop offset="100%" stop-color="#242734" stop-opacity="0.0" />
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
  // Strictly bounded to plate dimensions (never exceeds plate width/height)
  const penumbraW = Math.min(plateW, Math.max(32, Math.round(scaledW * 1.25)));
  const penumbraH = Math.min(plateH, Math.max(16, Math.round(scaledH * 0.25)));

  const penumbraSvg = `
    <svg width="${penumbraW}" height="${penumbraH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="penumbraG" cx="50%" cy="50%" rx="50%" ry="50%">
          <stop offset="0%" stop-color="#141720" stop-opacity="0.25" />
          <stop offset="50%" stop-color="#1a1d28" stop-opacity="0.12" />
          <stop offset="85%" stop-color="#242734" stop-opacity="0.03" />
          <stop offset="100%" stop-color="#242734" stop-opacity="0.0" />
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
  try {
    const meta = await sharp(productBuffer).metadata();
    const w = meta.width || scaledW;
    const h = meta.height || scaledH;

    const bounceSvg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bounceGrad" x1="0%" y1="100%" x2="0%" y2="70%">
            <stop offset="0%" stop-color="#d8cebf" stop-opacity="0.30" />
            <stop offset="50%" stop-color="#e8decb" stop-opacity="0.12" />
            <stop offset="100%" stop-color="#e8decb" stop-opacity="0.0" />
          </linearGradient>
        </defs>
        <rect width="${w}" height="${h}" fill="url(#bounceGrad)" />
      </svg>
    `;

    return await sharp(productBuffer)
      .composite([
        {
          input: Buffer.from(bounceSvg),
          blend: "soft-light",
        },
      ])
      .png()
      .toBuffer();
  } catch {
    return productBuffer;
  }
}

/**
 * Composites the authoritative raw product cutout onto a generated or procedural plate.
 *
 * Rules:
 * 1. Raw product pixels are preserved without alteration (only proportional lanczos3 resize + ambient bounce).
 * 2. Multi-layer contact, directional cast, and ambient shadows are positioned beneath the product.
 * 3. Product scale is strictly fit inside 75–80% of plate canvas (fixed anchor on lower third ground plane).
 * 4. Product and all composite layers NEVER exceed the plate width or height.
 */
export async function compositeProductOnPlate(options: CompositeProductOptions): Promise<Buffer> {
  const { plateBuffer, productCutoutBuffer } = options;

  // 1. Inspect plate dimensions
  const plateMeta = await sharp(plateBuffer).metadata();
  const plateW = plateMeta.width || 1024;
  const plateH = plateMeta.height || 1024;

  // 2. Pre-resize product cutout automatically using Sharp
  // Skalakan gambar produk agar muat proporsional di dalam kanvas latar studio
  // (gunakan fit: 'inside' dengan ukuran maksimal sekitar 75–80% dari dimensi plat latar).
  const maxProductW = Math.max(64, Math.round(plateW * 0.78));
  const maxProductH = Math.max(64, Math.round(plateH * 0.78));

  // Safely trim transparent borders first (if present)
  let preprocessedCutout = productCutoutBuffer;
  try {
    preprocessedCutout = await sharp(productCutoutBuffer)
      .trim({ threshold: 5 })
      .ensureAlpha()
      .toBuffer();
  } catch {
    preprocessedCutout = await sharp(productCutoutBuffer).ensureAlpha().toBuffer();
  }

  // Otomatis resize proporsional dengan fit: 'inside' sehingga tidak pernah melebihi plat
  const resizedProductResult = await sharp(preprocessedCutout)
    .resize(maxProductW, maxProductH, {
      fit: "inside",
      kernel: "lanczos3",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer({ resolveWithObject: true });

  // Pastikan dimensi gambar produk yang akan ditempel tidak pernah melebihi lebar/tinggi gambar latar
  const scaledW = Math.min(plateW, Math.max(16, resizedProductResult.info.width));
  const scaledH = Math.min(plateH, Math.max(16, resizedProductResult.info.height));
  let productResized = resizedProductResult.data;

  // Extra guard: If by any chance dimensions exceed plate dimensions, strictly clamp
  if (resizedProductResult.info.width > plateW || resizedProductResult.info.height > plateH) {
    productResized = await sharp(productResized)
      .resize(scaledW, scaledH, { fit: "inside" })
      .png()
      .toBuffer();
  }

  // 3. Fixed anchor positioning:
  // Center horizontally; bottom edge touches the ground baseline around 76% down the frame
  const posX = Math.max(0, Math.min(plateW - scaledW, Math.round((plateW - scaledW) / 2)));
  const baselineY = Math.round(plateH * 0.76);
  let posY = baselineY - scaledH;

  // Ensure top boundary has breathing space
  const minTop = Math.round(plateH * 0.08);
  if (posY < minTop) {
    posY = minTop;
  }
  // Ensure product doesn't exceed bottom boundary
  if (posY + scaledH > plateH) {
    posY = Math.max(0, plateH - scaledH);
  }

  // 4. Apply subtle warm ambient color bounce to ground product into studio scene
  const productIntegrated = await applyAmbientColorBounce(productResized, scaledW, scaledH);

  // 5. Generate multi-layer shadows (Ambient Penumbra -> Cast Shadow -> Contact Shadow)
  const shadows = await generateMultiLayerShadows(scaledW, scaledH, plateW, plateH);
  const shadowCenterBottomY = posY + scaledH;

  const penumbraMeta = await sharp(shadows.ambientPenumbra.input).metadata();
  const castMeta = await sharp(shadows.castShadow.input).metadata();
  const contactMeta = await sharp(shadows.contactShadow.input).metadata();

  const penumbraW = penumbraMeta.width || 0;
  const penumbraH = penumbraMeta.height || 0;
  const castW = castMeta.width || 0;
  const castH = castMeta.height || 0;
  const contactW = contactMeta.width || 0;
  const contactH = contactMeta.height || 0;

  const penumbraLeft = Math.max(0, Math.min(plateW - penumbraW, Math.round(posX + (scaledW - penumbraW) / 2)));
  const penumbraTop = Math.max(0, Math.min(plateH - penumbraH, Math.round(shadowCenterBottomY + shadows.ambientPenumbra.topOffset)));

  const castLeft = Math.max(0, Math.min(plateW - castW, Math.round(posX + (scaledW - castW) / 2 + shadows.castShadow.leftOffset)));
  const castTop = Math.max(0, Math.min(plateH - castH, Math.round(shadowCenterBottomY + shadows.castShadow.topOffset)));

  const contactLeft = Math.max(0, Math.min(plateW - contactW, Math.round(posX + (scaledW - contactW) / 2)));
  const contactTop = Math.max(0, Math.min(plateH - contactH, Math.round(shadowCenterBottomY + shadows.contactShadow.topOffset)));

  // 6. Final Multi-layer Composite:
  // Background Plate -> Ambient Penumbra -> Directional Cast Shadow -> Contact Occlusion -> Authentic Integrated Product
  const rawLayers: OverlayOptions[] = [
    {
      input: shadows.ambientPenumbra.input,
      left: penumbraLeft,
      top: penumbraTop,
      blend: "over",
    },
    {
      input: shadows.castShadow.input,
      left: castLeft,
      top: castTop,
      blend: "over",
    },
    {
      input: shadows.contactShadow.input,
      left: contactLeft,
      top: contactTop,
      blend: "over",
    },
    {
      input: productIntegrated,
      left: posX,
      top: posY,
      blend: "over",
    },
  ];

  // Defensive validation & clamping: ensure NO overlay ever exceeds plate dimensions or boundary
  const safeCompositeLayers: OverlayOptions[] = [];
  for (const layer of rawLayers) {
    if (!layer.input) continue;
    let inputBuf = layer.input as Buffer;
    const lMeta = await sharp(inputBuf).metadata();
    let lW = lMeta.width || 0;
    let lH = lMeta.height || 0;

    let finalLeft = typeof layer.left === "number" ? layer.left : 0;
    let finalTop = typeof layer.top === "number" ? layer.top : 0;

    if (lW > plateW || lH > plateH) {
      const targetW = Math.min(lW, plateW);
      const targetH = Math.min(lH, plateH);
      inputBuf = await sharp(inputBuf).resize(targetW, targetH, { fit: "inside" }).toBuffer();
      const updatedMeta = await sharp(inputBuf).metadata();
      lW = updatedMeta.width || targetW;
      lH = updatedMeta.height || targetH;
    }

    finalLeft = Math.max(0, Math.min(plateW - lW, finalLeft));
    finalTop = Math.max(0, Math.min(plateH - lH, finalTop));

    safeCompositeLayers.push({
      input: inputBuf,
      left: finalLeft,
      top: finalTop,
      blend: layer.blend || "over",
    });
  }

  return sharp(plateBuffer)
    .composite(safeCompositeLayers)
    .jpeg({ quality: 94, mozjpeg: true })
    .toBuffer();
}
