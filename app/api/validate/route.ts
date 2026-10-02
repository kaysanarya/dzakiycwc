import { NextRequest, NextResponse } from "next/server";
import { validateImages } from "@/lib/ai/validateImages";
import { validateApiKeyAndProvider, sanitizeErrorMessage } from "@/lib/auth/serverAuth";
import { ProductBlueprint, ProductLocks, UploadedImage } from "@/types";

export async function POST(req: NextRequest) {
  let activeKey: string | undefined;
  try {
    const body = await req.json();
    const { sourceImages, generatedImageUrl, blueprint, locks, angle, userProvider } = body as {
      sourceImages: UploadedImage[];
      generatedImageUrl: string;
      blueprint: ProductBlueprint;
      locks: ProductLocks;
      angle?: string;
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

    if (!generatedImageUrl || !blueprint) {
      return NextResponse.json(
        { error: "Image URL and Product Blueprint are required for validation." },
        { status: 400 }
      );
    }

    const validationResult = await validateImages(
      {
        sourceImages,
        generatedImageUrl,
        blueprint,
        locks,
        angle: angle || "Perspective",
      },
      {
        provider: validation.provider,
        apiKey: validation.apiKey,
      }
    );

    return NextResponse.json({
      success: true,
      validation: validationResult,
    });
  } catch (err: unknown) {
    const safeError = sanitizeErrorMessage(err, [activeKey]);
    console.error("API /api/validate error:", safeError);
    return NextResponse.json(
      {
        error: "Validation failed. " + safeError,
      },
      { status: 500 }
    );
  }
}
