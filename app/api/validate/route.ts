import { NextRequest, NextResponse } from "next/server";
import { validateImages } from "@/lib/ai/validateImages";
import { validateApiKeyAndProvider, sanitizeErrorMessage } from "@/lib/auth/serverAuth";
import { ProductBlueprint, ProductLocks, UploadedImage } from "@/types";

export async function POST(req: NextRequest) {
  let activeKey: string | undefined;
  try {
    const body = await req.json();
    const { sourceImages, generatedImageUrl, blueprint, locks, angle } = body as {
      sourceImages: UploadedImage[];
      generatedImageUrl: string;
      blueprint: ProductBlueprint;
      locks: ProductLocks;
      angle?: string;
    };

    // Resolve provider & API key (BYOK priority with server key demo quota fallback)
    const validation = await validateApiKeyAndProvider(req, { quotaCost: 0 });
    if (!validation.allowed) {
      if (validation.status === 429) {
        return NextResponse.json(
          { code: "DEMO_QUOTA_EXCEEDED", error: validation.error, resetAt: validation.resetAt },
          { status: 429, headers: { "x-demo-remaining": "0" } }
        );
      }
      return NextResponse.json({ error: validation.error }, { status: validation.status ?? 400 });
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

    const res = NextResponse.json({
      success: true,
      validation: validationResult,
    });
    if (validation.quotaRemaining !== undefined) {
      res.headers.set("x-demo-remaining", String(validation.quotaRemaining));
    }
    return res;
  } catch (err: unknown) {
    const safeError = sanitizeErrorMessage(err, [activeKey]);
    console.error("API /api/validate error:", safeError);

    const isRateLimit =
      safeError.toLowerCase().includes("rate") ||
      safeError.toLowerCase().includes("quota") ||
      safeError.toLowerCase().includes("429");
    const userMsg = isRateLimit
      ? "Server sedang memproses antrean, silakan coba beberapa saat lagi."
      : "Terjadi kesalahan saat validasi gambar. Silakan coba lagi.";

    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
