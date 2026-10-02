import { NextRequest, NextResponse } from "next/server";
import { analyzeProduct } from "@/lib/ai/analyzeProduct";
import { validateApiKeyAndProvider, sanitizeErrorMessage } from "@/lib/auth/serverAuth";
import { UploadedImage, ProductCategory } from "@/types";

export async function POST(req: NextRequest) {
  let activeKey: string | undefined;
  try {
    const body = await req.json();
    const { images, categoryHint, userNotes, userProvider } = body as {
      images: UploadedImage[];
      categoryHint?: ProductCategory;
      userNotes?: string;
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

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: "No raw product images provided for analysis." },
        { status: 400 }
      );
    }

    const blueprint = await analyzeProduct(
      {
        images,
        categoryHint,
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
    console.error("API /api/analyze error:", safeError);
    return NextResponse.json(
      {
        error: "Analysis failed. " + safeError,
      },
      { status: 500 }
    );
  }
}
