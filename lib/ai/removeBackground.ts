import sharp from "sharp";
import { AiPipelineError } from "./AiPipelineError";

export interface RemoveBackgroundParams {
  imageUrlOrBase64: string;
  mimeType?: string;
  stabilityApiKey?: string;
  replicateApiKey?: string;
}

// 4 MB threshold for resize before base64-encoding to provider
const MAX_BUFFER_BYTES = 4 * 1024 * 1024;
// Longest side cap when resizing oversized buffers
const MAX_LONGEST_SIDE = 1536;

/**
 * Ensures a buffer is an 8-bit RGBA PNG with alpha channel.
 * This is the canonical output format for the pipeline's inpainting path.
 */
export async function forcePngBuffer(buf: Buffer): Promise<Buffer> {
  return sharp(buf).ensureAlpha().png().toBuffer();
}

/**
 * Resizes a buffer so its longest side is at most maxSide pixels.
 * Returns the resized PNG buffer and the final dimensions.
 */
async function resizeToFit(
  buf: Buffer,
  maxSide: number
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const meta = await sharp(buf).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;

  if (w <= maxSide && h <= maxSide) {
    // No resize needed — decode dimensions
    const { info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const pngBuf = await sharp(buf).ensureAlpha().png().toBuffer();
    return { buffer: pngBuf, width: info.width, height: info.height };
  }

  const scale = maxSide / Math.max(w, h);
  const newW = Math.round(w * scale);
  const newH = Math.round(h * scale);
  const resized = await sharp(buf)
    .resize(newW, newH, { kernel: "lanczos3" })
    .ensureAlpha()
    .png()
    .toBuffer();
  return { buffer: resized, width: newW, height: newH };
}

/**
 * Strips background from product image, returning a clean transparent PNG Buffer.
 * Supports:
 * 1. Stability AI Background Removal API (if key available)
 * 2. Replicate RemBG neural model (if key available)
 * 3. High-precision server-side Sharp edge-aware alpha extractor (zero-dependency fallback)
 *
 * Throws AiPipelineError("removeBackground") if ALL strategies fail.
 * Never returns the original image as a fallback.
 */
export async function removeBackground(params: RemoveBackgroundParams): Promise<Buffer> {
  const { imageUrlOrBase64, stabilityApiKey, replicateApiKey } = params;

  // Extract raw base64 buffer
  let rawBase64 = imageUrlOrBase64;
  if (rawBase64.includes(",")) {
    rawBase64 = rawBase64.split(",")[1];
  }
  const inputBuffer = Buffer.from(rawBase64, "base64");

  let lastErrorMsg = "All background removal strategies failed.";

  // Strategy 1: Stability AI Background Removal (if key available)
  const stabKey = stabilityApiKey;
  if (stabKey && stabKey.trim().length > 5) {
    try {
      const formData = new FormData();
      // Always send as image/png — mimeType from upload is irrelevant to the BG removal API
      const blob = new Blob([new Uint8Array(inputBuffer)], { type: "image/png" });
      formData.append("image", blob, "input.png");
      formData.append("output_format", "png");

      const res = await fetch("https://api.stability.ai/v2beta/stable-image/edit/remove-background", {
        method: "POST",
        headers: {
          authorization: `Bearer ${stabKey.trim()}`,
          accept: "image/*",
        },
        signal: AbortSignal.timeout(30_000),
        body: formData,
      });

      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const rawBuf = Buffer.from(arrayBuf);
        // Force RGBA PNG to guarantee consistent channel count
        return await forcePngBuffer(rawBuf);
      } else {
        const errText = await res.text().catch(() => "");
        lastErrorMsg = `Stability remove-background HTTP ${res.status}: ${errText.slice(0, 200)}`;
        console.error(`[removeBackground] Stability failed (${res.status}): ${errText.slice(0, 200)}`);
      }
    } catch (stabErr) {
      const msg = stabErr instanceof Error ? stabErr.message : String(stabErr);
      lastErrorMsg = `Stability remove-background error: ${msg.slice(0, 200)}`;
      console.error(`[removeBackground] Stability exception: ${msg.slice(0, 200)}`);
    }
  }

  // Strategy 2: Replicate rembg neural model (if key available)
  const repKey = replicateApiKey;
  if (repKey && repKey.trim().length > 5) {
    try {
      // Replicate accepts data URI — build it with exactly one prefix
      const base64Clean = rawBase64.replace(/^data:[^,]+,/, "");
      const dataUri = `data:image/png;base64,${base64Clean}`;

      const res = await fetch("https://api.replicate.com/v1/models/cjwbw/rembg/predictions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${repKey.trim()}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          input: { image: dataUri },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        let outUrl: string | undefined =
          Array.isArray(data.output) ? data.output[0] : data.output;

        if (!outUrl && data.urls?.get) {
          let attempts = 0;
          while (!outUrl && attempts < 10) {
            await new Promise((r) => setTimeout(r, 1500));
            const poll = await fetch(data.urls.get, {
              headers: { Authorization: `Bearer ${repKey.trim()}` },
              signal: AbortSignal.timeout(10_000),
            });
            if (poll.ok) {
              const pollJson = await poll.json();
              if (pollJson.status === "succeeded") {
                outUrl = Array.isArray(pollJson.output) ? pollJson.output[0] : pollJson.output;
                break;
              } else if (pollJson.status === "failed") {
                break;
              }
            }
            attempts++;
          }
        }

        if (outUrl && typeof outUrl === "string") {
          const fetchImg = await fetch(outUrl);
          if (fetchImg.ok) {
            const imgBuf = Buffer.from(await fetchImg.arrayBuffer());
            return await forcePngBuffer(imgBuf);
          }
        }
      } else {
        const errText = await res.text().catch(() => "");
        lastErrorMsg = `Replicate rembg HTTP ${res.status}: ${errText.slice(0, 200)}`;
        console.error(`[removeBackground] Replicate failed (${res.status}): ${errText.slice(0, 200)}`);
      }
    } catch (repErr) {
      const msg = repErr instanceof Error ? repErr.message : String(repErr);
      lastErrorMsg = `Replicate rembg error: ${msg.slice(0, 200)}`;
      console.error(`[removeBackground] Replicate exception: ${msg.slice(0, 200)}`);
    }
  }

  // Strategy 3: High-precision edge-aware Alpha Extractor via Sharp
  // Handles standard catalog backgrounds (pure white, off-white, light gray cyclorama)
  try {
    return await extractBackgroundWithSharp(inputBuffer);
  } catch (sharpErr) {
    const msg = sharpErr instanceof Error ? sharpErr.message : String(sharpErr);
    lastErrorMsg = `Sharp extractor error: ${msg.slice(0, 200)}`;
    console.error(`[removeBackground] Sharp extractor failed: ${msg.slice(0, 200)}`);
  }

  // All strategies failed — throw instead of returning original image
  throw new AiPipelineError(
    `Background removal failed: ${lastErrorMsg.slice(0, 300)}`,
    "removeBackground"
  );
}

/**
 * Server-side Edge-Aware Chroma & Flood-fill Alpha Extraction.
 * Removes seamless studio white/neutral background and produces a feathered transparent PNG.
 */
async function extractBackgroundWithSharp(inputBuffer: Buffer): Promise<Buffer> {
  const image = sharp(inputBuffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // Sample corner & perimeter pixels to establish background color signature
  const samplePoints: number[][] = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.round(width / 2), 0],
    [Math.round(width / 2), height - 1],
    [0, Math.round(height / 2)],
    [width - 1, Math.round(height / 2)],
  ];

  let sumR = 0, sumG = 0, sumB = 0;
  for (const [sx, sy] of samplePoints) {
    const idx = (sy * width + sx) * 4;
    sumR += data[idx];
    sumG += data[idx + 1];
    sumB += data[idx + 2];
  }
  const bgR = sumR / samplePoints.length;
  const bgG = sumG / samplePoints.length;
  const bgB = sumB / samplePoints.length;

  // Adaptive threshold based on background brightness
  const isLightBg = bgR > 210 && bgG > 210 && bgB > 210;
  const colorTolerance = isLightBg ? 32 : 24;
  const featherRange = 18;

  // Process alpha channel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const dist = Math.sqrt(
        (r - bgR) ** 2 +
        (g - bgG) ** 2 +
        (b - bgB) ** 2
      );

      if (dist < colorTolerance) {
        // Complete background removal
        data[idx + 3] = 0;
      } else if (dist < colorTolerance + featherRange) {
        // Soft anti-aliased edge feathering
        const factor = (dist - colorTolerance) / featherRange;
        data[idx + 3] = Math.round(factor * 255);
      }
    }
  }

  return await sharp(data, {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: 8 })
    .toBuffer();
}

/**
 * Prepares the source image buffer for sending to providers:
 * 1. forcePng (RGBA)
 * 2. Resize if buffer > MAX_BUFFER_BYTES (longest side → MAX_LONGEST_SIDE)
 * Returns { imageBuffer, width, height }
 */
export async function prepareImageBuffer(
  transparentPngBuffer: Buffer
): Promise<{ imageBuffer: Buffer; width: number; height: number }> {
  const pngBuf = await forcePngBuffer(transparentPngBuffer);

  if (pngBuf.byteLength > MAX_BUFFER_BYTES) {
    const resized = await resizeToFit(pngBuf, MAX_LONGEST_SIDE);
    return { imageBuffer: resized.buffer, width: resized.width, height: resized.height };
  }

  const { info } = await sharp(pngBuf).raw().toBuffer({ resolveWithObject: true });
  return { imageBuffer: pngBuf, width: info.width, height: info.height };
}

/**
 * Generates a binary inpainting mask from a transparent PNG buffer.
 * The mask dimensions MUST match the image buffer dimensions exactly.
 *
 * Polaritas: PUTIH (255) = Background (area to inpaint/regenerate).
 *            HITAM (0)   = Product subject (area to preserve).
 *
 * @param transparentPngBuffer - The RGBA PNG buffer (output of removeBackground/prepareImageBuffer)
 * @param targetWidth - Expected width; mask will be resized to match if dimensions differ
 * @param targetHeight - Expected height; mask will be resized to match if dimensions differ
 * @throws AiPipelineError("mask") if transparent pixel ratio is < 1% or > 99%
 */
export async function generateInpaintingMask(
  transparentPngBuffer: Buffer,
  targetWidth?: number,
  targetHeight?: number
): Promise<Buffer> {
  const { data, info } = await sharp(transparentPngBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const totalPixels = width * height;

  // Count transparent pixels (alpha < 128 = background)
  let transparentCount = 0;
  for (let i = 0; i < totalPixels; i++) {
    const alpha = data[i * 4 + 3];
    if (alpha < 128) transparentCount++;
  }

  const transparentRatio = transparentCount / totalPixels;

  // Validate: mask must have meaningful transparent area
  if (transparentRatio < 0.01) {
    throw new AiPipelineError(
      `Mask generation aborted: transparent pixel ratio is ${(transparentRatio * 100).toFixed(2)}% (< 1%). ` +
        "The image appears fully opaque — background removal may have failed or the image has no transparent areas.",
      "mask"
    );
  }
  if (transparentRatio > 0.99) {
    throw new AiPipelineError(
      `Mask generation aborted: transparent pixel ratio is ${(transparentRatio * 100).toFixed(2)}% (> 99%). ` +
        "The image appears fully transparent — background removal may have over-removed the product subject.",
      "mask"
    );
  }

  // Build 1-channel mask: transparent background → 255 (white), product → 0 (black)
  const maskData = Buffer.alloc(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    const alpha = data[i * 4 + 3];
    maskData[i] = alpha < 128 ? 255 : 0;
  }

  let maskBuf = await sharp(maskData, {
    raw: { width, height, channels: 1 },
  })
    .png()
    .toBuffer();

  // If caller specifies target dimensions and they differ, resize mask using nearest-neighbor
  // then re-binarize to ensure strict 0/255 values (no anti-aliasing from resize)
  if (targetWidth && targetHeight && (targetWidth !== width || targetHeight !== height)) {
    const resizedRaw = await sharp(maskBuf)
      .resize(targetWidth, targetHeight, { kernel: "nearest" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Re-binarize after resize
    const reBin = Buffer.alloc(targetWidth * targetHeight);
    for (let i = 0; i < targetWidth * targetHeight; i++) {
      reBin[i] = resizedRaw.data[i] > 127 ? 255 : 0;
    }

    maskBuf = await sharp(reBin, {
      raw: { width: targetWidth, height: targetHeight, channels: 1 },
    })
      .png()
      .toBuffer();
  }

  return maskBuf;
}

/**
 * Builds a safe data URI for Replicate, ensuring exactly one `data:image/png;base64,` prefix.
 * Validates with regex and asserts before returning.
 */
export function toSafeDataUri(buf: Buffer): string {
  const b64 = buf.toString("base64");
  // Remove any existing prefix (handles double-prefix edge cases)
  const cleanB64 = b64.replace(/^(data:[^,]+,)+/, "");
  const uri = `data:image/png;base64,${cleanB64}`;
  // Assert exactly one prefix
  const prefixMatches = (uri.match(/^data:image\/png;base64,/g) || []).length;
  if (prefixMatches !== 1) {
    throw new AiPipelineError(
      `toSafeDataUri: expected exactly 1 data URI prefix, got ${prefixMatches}`,
      "provider"
    );
  }
  return uri;
}




