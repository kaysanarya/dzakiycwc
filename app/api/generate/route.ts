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
      userProvider,
    } = body as {
      blueprint: ProductBlueprint;
      locks: ProductLocks;
      direction: PhotographyDirection;
      preservation: PreservationSettings;
      sourceImages: UploadedImage[];
      referenceImages?: UploadedImage[];
      count?: number;
      userProvider?: string;
    };

    // 1. Validate Provider, Body size, and Header x-api-key
    const validation = validateApiKeyAndProvider(req, {
      provider: userProvider,
    });
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

    // Generate product images with active or configured visual provider (BYOK)
    const providerOptions = {
      provider: validation.provider,
      apiKey: validation.apiKey,
    };

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

    // Step 8: Visual Validation & Rejection handling
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
    return NextResponse.json(
      { error: "Generation failed. " + safeError },
      { status: 500 }
    );
  }
}
