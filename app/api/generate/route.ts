import { NextRequest, NextResponse } from "next/server";
import { generateImages } from "@/lib/ai/generateImages";
import { analyzeReference } from "@/lib/ai/analyzeReference";
import { getAIProvider } from "@/lib/ai/factory";
import { validateApiKeyAndProvider, sanitizeErrorMessage } from "@/lib/auth/serverAuth";
import {
  ProductBlueprint,
  ProductLocks,
  PhotographyDirection,
  PreservationSettings,
  UploadedImage,
  GeneratedOutput,
} from "@/types";

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

    // Resolve provider & API key from server environment (no client key needed)
    const validation = validateApiKeyAndProvider(req, {});
    if (!validation.allowed) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }
    activeKey = validation.apiKey;

    if (!sourceImages || sourceImages.length === 0) {
      return NextResponse.json(
        { error: "Authoritative raw product image is required." },
        { status: 400 }
      );
    }

    if (!blueprint) {
      return NextResponse.json(
        { error: "Product blueprint must be established before generation." },
        { status: 400 }
      );
    }

    // Step 3: Analyze Reference if provided
    let referenceAnalysis = undefined;
    if (referenceImages && referenceImages.length > 0) {
      try {
        referenceAnalysis = await analyzeReference({
          images: referenceImages,
        });
      } catch (refErr) {
        console.warn("Reference analysis warning:", refErr);
      }
    }

    // Generate product images with server-resolved provider (no BYOK)
    const providerOptions = {
      provider: validation.provider,
      apiKey: validation.apiKey,
    };

    console.log(
      `[Pipeline /api/generate] Provider: ${validation.provider} | ` +
      `Reference Strength: ${preservation?.referenceStrength ?? 70}% | ` +
      `Strict Mode: ${preservation?.strictProductMode ?? true} | ` +
      `Reference Images: ${referenceImages?.length || 0}`
    );

    const rawOutputs: GeneratedOutput[] = await generateImages(
      {
        blueprint,
        locks,
        direction,
        preservation,
        referenceAnalysis,
        sourceImages,
        referenceImages,
        count: Math.min(Math.max(1, count), 8),
      },
      providerOptions
    );

    // Visual Validation & Rejection handling
    const validatedOutputs = rawOutputs.map((output) => {
      if (output.consistencyScore < 85) {
        return {
          ...output,
          status: "rejected" as const,
        };
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
    const safeError = sanitizeErrorMessage(err, [activeKey]);
    console.error("API /api/generate error:", safeError);

    const isRateLimit =
      safeError.toLowerCase().includes("rate") ||
      safeError.toLowerCase().includes("quota") ||
      safeError.toLowerCase().includes("429");
    const userMsg = isRateLimit
      ? "Server sedang memproses antrean, silakan coba beberapa saat lagi."
      : "Terjadi kesalahan saat menghasilkan gambar. Silakan coba lagi.";

    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
