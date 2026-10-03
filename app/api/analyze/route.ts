import { NextRequest, NextResponse } from "next/server";
import { analyzeProduct } from "@/lib/ai/analyzeProduct";
import { validateApiKeyAndProvider, sanitizeErrorMessage } from "@/lib/auth/serverAuth";
import { UploadedImage, ProductCategory } from "@/types";

export async function POST(req: NextRequest) {
  let activeKey: string | undefined;
  try {
    const body = await req.json();
    const { images, categoryHint, userNotes } = body as {
      images: UploadedImage[];
      categoryHint?: ProductCategory;
      userNotes?: string;
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

    const res = NextResponse.json({
      success: true,
      blueprint,
    });
    if (validation.quotaRemaining !== undefined) {
      res.headers.set("x-demo-remaining", String(validation.quotaRemaining));
    }
    return res;
  } catch (err: unknown) {
    const safeError = sanitizeErrorMessage(err, [activeKey]);
    console.error("API /api/analyze error:", safeError);

    // User-friendly error (no technical API details exposed)
    const isRateLimit =
      safeError.toLowerCase().includes("rate") ||
      safeError.toLowerCase().includes("quota") ||
      safeError.toLowerCase().includes("429");
    const userMsg = isRateLimit
      ? "Server sedang memproses antrean, silakan coba beberapa saat lagi."
      : "Terjadi kesalahan pada analisis produk. Silakan coba lagi.";

    return NextResponse.json({ error: userMsg }, { status: 500 });
  }
}
