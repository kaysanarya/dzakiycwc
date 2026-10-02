import { NextRequest, NextResponse } from "next/server";
import { buildBlueprint } from "@/lib/ai/buildBlueprint";
import { validateApiKeyAndProvider, sanitizeErrorMessage } from "@/lib/auth/serverAuth";
import { UploadedImage, ProductCategory, ProductBlueprint } from "@/types";

export async function POST(req: NextRequest) {
  let activeKey: string | undefined;
  try {
    const body = await req.json();
    const { images, category, existingBlueprint, userNotes, userProvider } = body as {
      images: UploadedImage[];
      category?: ProductCategory;
      existingBlueprint?: Partial<ProductBlueprint>;
      userNotes?: string;
      userProvider?: string;
    };

    // Validate Provider, Body size, and Header x-api-key
    const validation = validateApiKeyAndProvider(req, {
      provider: userProvider,
    });
    if (!validation.allowed) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }
    activeKey = validation.apiKey;

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: "At least one source image is required to build a blueprint." },
        { status: 400 }
      );
    }

    const blueprint = await buildBlueprint(
      {
        images,
        category,
        existingBlueprint,
        userNotes,
      },
      {
        provider: validation.provider,
        apiKey: validation.apiKey,
      }
    );

    return NextResponse.json({
      success: true,
      blueprint,
    });
  } catch (err: unknown) {
    const safeError = sanitizeErrorMessage(err, [activeKey]);
    console.error("API /api/blueprint error:", safeError);
    return NextResponse.json(
      {
        error: "Blueprint construction failed. " + safeError,
      },
      { status: 500 }
    );
  }
}
