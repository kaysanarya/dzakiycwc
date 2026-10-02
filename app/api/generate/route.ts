import { NextRequest, NextResponse } from "next/server";
import { generateImages } from "@/lib/ai/generateImages";
import { analyzeReference } from "@/lib/ai/analyzeReference";
import { removeBackground, prepareImageBuffer } from "@/lib/ai/removeBackground";
import { getAIProvider } from "@/lib/ai/factory";
import { validateApiKeyAndProvider, sanitizeErrorMessage } from "@/lib/auth/serverAuth";
import { AiPipelineError, pipelineErrorToStatus } from "@/lib/ai/AiPipelineError";
import {
  ProductBlueprint,
  ProductLocks,
  PhotographyDirection,
  PreservationSettings,
  UploadedImage,
  GeneratedOutput,
} from "@/types";

// Node.js runtime required for sharp (native binaries) and streaming API calls.
export const runtime = "nodejs";
// 60-second max execution duration for this route.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let activeKey: string | undefined;
  try {
    const body = await req.json();
    const {
      blueprint,
      locks,
      direction,
      preservation,
      sourceImages,
      referenceImages,
      count = 4,
    } = body as {
      blueprint: ProductBlueprint;
      locks: ProductLocks;
      direction: PhotographyDirection;
      preservation: PreservationSettings;
      sourceImages: UploadedImage[];
      referenceImages?: UploadedImage[];
      count?: number;
    };

    // Resolve provider & API key from server environment (BYOK via env vars, no client key needed)
    const validation = validateApiKeyAndProvider(req, {});
    if (!validation.allowed) {
      return NextResponse.json(
        { success: false, error: { stage: "auth", message: validation.error } },
        { status: validation.status ?? 401 }
      );
    }
    activeKey = validation.apiKey;

    if (!sourceImages || sourceImages.length === 0) {
      return NextResponse.json(
        { success: false, error: { stage: "auth", message: "Authoritative raw product image is required." } },
        { status: 400 }
      );
    }

    if (!blueprint) {
      return NextResponse.json(
        { success: false, error: { stage: "auth", message: "Product blueprint must be established before generation." } },
        { status: 400 }
      );
    }

    // Resolve keys for removeBackground: use the BYOK-resolved key for the active provider,
    // plus fall back to the dedicated env vars for secondary bg-removal providers.
    const stabilityKeyForBg = validation.provider === "stability"
      ? validation.apiKey
      : process.env.STABILITY_API_KEY;
    const replicateKeyForBg = validation.provider === "replicate"
      ? validation.apiKey
      : (process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY);

    // Step 1: Pre-processing Phase — Mandatory Background Removal → forcePng → optional resize
    console.log(`[Pipeline /api/generate] Pre-processing: removing background from ${sourceImages.length} source image(s)...`);

    const isolatedSourceImages: UploadedImage[] = await Promise.all(
      sourceImages.map(async (img, idx) => {
        // removeBackground now returns Buffer; throws AiPipelineError if all strategies fail
        const rawBuf = await removeBackground({
          imageUrlOrBase64: img.dataUrl,
          mimeType: img.type,
          stabilityApiKey: stabilityKeyForBg,
          replicateApiKey: replicateKeyForBg,
        });

        // forcePng → resize to ≤4MB if needed; image and mask will be generated from this buffer
        const { imageBuffer } = await prepareImageBuffer(rawBuf);
        const b64 = imageBuffer.toString("base64");

        return {
          ...img,
          dataUrl: `data:image/png;base64,${b64}`,
          type: "image/png",
          name: `${img.name || `product-${idx}`}-isolated.png`,
        };
      })
    );

    // Step 2: Analyze Reference if provided (optional — failure is not fatal)
    let referenceAnalysis = undefined;
    if (referenceImages && referenceImages.length > 0) {
      try {
        referenceAnalysis = await analyzeReference({ images: referenceImages });
      } catch (refErr: unknown) {
        // Reference analysis is optional; log but do not abort pipeline
        if (refErr instanceof Error && refErr.name === "AbortError") throw refErr;
        const safeMsg = sanitizeErrorMessage(refErr, [activeKey]).slice(0, 200);
        console.error(`[Pipeline /api/generate] Reference analysis warning (non-fatal): ${safeMsg}`);
      }
    }

    const providerOptions = {
      provider: validation.provider,
      apiKey: validation.apiKey,
    };

    console.log(
      `[Pipeline /api/generate] Provider: ${validation.provider} | ` +
      `Count: ${count} | ` +
      `Reference Strength: ${preservation?.referenceStrength ?? 70}% | ` +
      `Strict Mode: ${preservation?.strictProductMode ?? true}`
    );

    // Step 3: Generate Images (provider handles concurrency internally, max 3 per batch)
    const rawOutputs: GeneratedOutput[] = await generateImages(
      {
        blueprint,
        locks,
        direction,
        preservation,
        referenceAnalysis,
        sourceImages: isolatedSourceImages,
        referenceImages,
        count: Math.min(Math.max(1, count), 8),
      },
      providerOptions
    );

    // Visual Validation & Rejection handling
    const validatedOutputs = rawOutputs.map((output) => {
      if (output.consistencyScore < 85) {
        return { ...output, status: "rejected" as const };
      }
      return output;
    });

    const activeProvider = getAIProvider(providerOptions);

    return NextResponse.json({
      success: true,
      provider: activeProvider.name,
      isDemo: activeProvider.isDemo,
      referenceAnalysis,
      outputs: validatedOutputs,
    });

  } catch (err: unknown) {
    // Do not log AbortError as a server error — client disconnected intentionally
    if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
      console.log("[Pipeline /api/generate] Request aborted by client.");
      return new NextResponse(null, { status: 499 });
    }

    const safeError = sanitizeErrorMessage(err, [activeKey]);
    const truncatedError = safeError.slice(0, 300);

    if (err instanceof AiPipelineError) {
      const status = pipelineErrorToStatus(err);
      console.error(
        `[Pipeline /api/generate] AiPipelineError stage=${err.stage} provider=${err.provider ?? "n/a"} status=${status}: ${truncatedError}`
      );
      return NextResponse.json(
        { success: false, error: { stage: err.stage, message: truncatedError } },
        { status }
      );
    }

    // Generic pipeline error
    const isRateLimit =
      truncatedError.toLowerCase().includes("rate") ||
      truncatedError.toLowerCase().includes("quota") ||
      truncatedError.toLowerCase().includes("429");

    const status = isRateLimit ? 429 : 500;
    const userMsg = isRateLimit
      ? "Server sedang memproses antrean, silakan coba beberapa saat lagi."
      : "Terjadi kesalahan saat menghasilkan gambar. Silakan coba lagi.";

    console.error(`[Pipeline /api/generate] Unhandled error (HTTP ${status}): ${truncatedError}`);

    return NextResponse.json(
      { success: false, error: { stage: "provider", message: userMsg } },
      { status }
    );
  }
}
