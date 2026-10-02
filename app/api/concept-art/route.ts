import { NextRequest, NextResponse } from "next/server";
import { validateApiKeyAndProvider, sanitizeErrorMessage } from "@/lib/auth/serverAuth";

// ─── Rate Limiting & TTL Pruning (F-12) ──────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 60_000;
const MAX_RATE_LIMIT_ENTRIES = 1000;
const PRUNE_THRESHOLD = 100;
let lastPruneTimestamp = 0;
const PRUNE_INTERVAL_MS = 30_000;

function pruneRateLimitMap(now: number): void {
  // 1. Evict expired entries if size exceeds threshold or interval elapsed
  if (rateLimitMap.size > PRUNE_THRESHOLD || now - lastPruneTimestamp > PRUNE_INTERVAL_MS) {
    for (const [key, entry] of rateLimitMap.entries()) {
      if (entry.resetAt <= now) {
        rateLimitMap.delete(key);
      }
    }
    lastPruneTimestamp = now;
  }

  // 2. Strictly bound maximum map size using FIFO eviction of oldest keys
  while (rateLimitMap.size > MAX_RATE_LIMIT_ENTRIES) {
    const oldestKey = rateLimitMap.keys().next().value;
    if (oldestKey !== undefined) {
      rateLimitMap.delete(oldestKey);
    } else {
      break;
    }
  }
}

// â”€â”€â”€ Art Style Prompt Suffixes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ART_STYLES: Record<string, string> = {
  cinematic: "cinematic film still, anamorphic lens, shallow depth of field, professional color grading, movie quality lighting, 35mm film grain, dramatic atmosphere",
  noire: "film noir style, high contrast black and white, dramatic shadows, chiaroscuro lighting, moody atmosphere, detective film aesthetic",
  cyberpunk: "cyberpunk neon aesthetic, rain-slicked streets, holographic projections, neon lights, futuristic dystopian atmosphere, Blade Runner inspired",
  anime: "anime movie poster style, hand-drawn aesthetic, vibrant colors, detailed illustration, Studio Ghibli quality, expressive characters",
  "concept-art": "professional concept art, detailed environment design, painterly style, epic scale, fantasy illustration, high detail matte painting",
  "retro-poster": "vintage movie poster illustration, retro color palette, bold typography layout, classic Hollywood golden age aesthetic, painted poster art",
  documentary: "documentary photography style, photojournalistic, raw and authentic, natural lighting, Kodak film stock, 1970s photography aesthetic",
  expressionist: "German expressionism inspired, distorted perspective, dramatic shadows, psychological atmosphere, angular compositions, surreal mood",
};

const DIMENSIONS: Record<string, { w: number; h: number }> = {
  poster: { w: 768, h: 1152 },
  landscape: { w: 1280, h: 720 },
  square: { w: 1024, h: 1024 },
  wide: { w: 1344, h: 768 },
};

function buildPrompt(userPrompt: string, style: string, movieRef?: string): string {
  const styleDesc = ART_STYLES[style] ?? ART_STYLES.cinematic;
  const ref = movieRef ? `, inspired by the visual world of "${movieRef}"` : "";
  return `${userPrompt}${ref}, ${styleDesc}, ultra high resolution, award winning composition, professional production quality`;
}

// â”€â”€â”€ Provider: Pollinations.ai (free, no key) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function generatePollinations(
  fullPrompt: string,
  aspectRatio: string,
  seed: number
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const { w, h } = DIMENSIONS[aspectRatio] ?? DIMENSIONS.poster;
  const encoded = encodeURIComponent(fullPrompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&model=flux-realism&nologo=true&seed=${seed}&enhance=true&nofeed=true`;

  const res = await fetch(url, {
    headers: { "User-Agent": "VELLUM-AI/1.0", "Referer": "https://vellum.ai" },
    signal: AbortSignal.timeout(90_000),
  });

  if (!res.ok) throw new Error(`Pollinations error: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  return { buffer, contentType };
}

// â”€â”€â”€ Provider: OpenAI DALL-E 3 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function generateDalle(
  apiKey: string,
  fullPrompt: string,
  aspectRatio: string
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const sizeMap: Record<string, string> = {
    poster: "1024x1792", landscape: "1792x1024", square: "1024x1024", wide: "1792x1024",
  };
  const size = sizeMap[aspectRatio] ?? "1024x1024";

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: fullPrompt.slice(0, 4000),
      n: 1,
      size,
      quality: "hd",
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`OpenAI error: ${err?.error?.message ?? res.status}`);
  }

  const data = await res.json() as { data?: { url?: string }[] };
  const imageUrl = data?.data?.[0]?.url;
  if (!imageUrl) throw new Error("No image URL returned from OpenAI");

  // Download the image and return as buffer
  const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(30_000) });
  if (!imgRes.ok) throw new Error("Failed to download DALL-E image");
  const buffer = await imgRes.arrayBuffer();
  return { buffer, contentType: "image/png" };
}

// â”€â”€â”€ Provider: Google Gemini Imagen 3 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function generateGeminiImagen(
  apiKey: string,
  fullPrompt: string,
  aspectRatio: string
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const ratioMap: Record<string, string> = {
    poster: "3:4", landscape: "16:9", square: "1:1", wide: "4:3",
  };
  const ratio = ratioMap[aspectRatio] ?? "1:1";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt: fullPrompt.slice(0, 2048) }],
      parameters: {
        sampleCount: 1,
        aspectRatio: ratio,
        safetyFilterLevel: "BLOCK_SOME",
        personGeneration: "ALLOW_ADULT",
      },
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`Gemini Imagen error: ${err?.error?.message ?? res.status}`);
  }

  const data = await res.json() as { predictions?: { bytesBase64Encoded?: string; mimeType?: string }[] };
  const prediction = data?.predictions?.[0];
  if (!prediction?.bytesBase64Encoded) throw new Error("No image data returned from Gemini");

  const bytes = Buffer.from(prediction.bytesBase64Encoded, "base64");
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return { buffer, contentType: prediction.mimeType ?? "image/png" };
}

// â”€â”€â”€ Main Route Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function POST(req: NextRequest) {
  // Rate limiting with active memory leak prevention (F-12)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  pruneRateLimitMap(now);

  const limiter = rateLimitMap.get(ip);
  if (limiter && now < limiter.resetAt) {
    if (limiter.count >= RATE_LIMIT) {
      return NextResponse.json({ error: "Rate limit exceeded. Please wait a moment." }, { status: 429 });
    }
    limiter.count++;
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
  }

  let body: {
    prompt?: string;
    style?: string;
    movieRef?: string;
    aspectRatio?: string;
    seed?: number;
    provider?: string;  // "pollinations" | "openai" | "gemini"
    apiKey?: string;    // Client-provided key (not stored server-side)
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    prompt,
    style = "cinematic",
    movieRef,
    aspectRatio = "poster",
    seed,
    provider = "pollinations",
  } = body;

  // Validate Provider, Body size, and Header x-api-key (BYOK)
  const validation = validateApiKeyAndProvider(req, {
    provider,
    isConceptArt: true,
  });
  if (!validation.allowed) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
    return NextResponse.json({ error: "Prompt must be at least 3 characters." }, { status: 400 });
  }
  if (prompt.length > 600) {
    return NextResponse.json({ error: "Prompt too long (max 600 characters)." }, { status: 400 });
  }

  const fullPrompt = buildPrompt(prompt.trim(), style, movieRef?.trim());
  const randomSeed = seed ?? Math.floor(Math.random() * 2_147_483_647);
  const { w, h } = DIMENSIONS[aspectRatio] ?? DIMENSIONS.poster;

  try {
    let result: { buffer: ArrayBuffer; contentType: string };

    if (provider === "openai") {
      result = await generateDalle(validation.apiKey!, fullPrompt, aspectRatio);
    } else if (provider === "gemini") {
      result = await generateGeminiImagen(validation.apiKey!, fullPrompt, aspectRatio);
    } else {
      // Default: Pollinations.ai (free, no key needed)
      result = await generatePollinations(fullPrompt, aspectRatio, randomSeed);
    }

    return new NextResponse(result.buffer, {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "no-store",
        "X-Seed": String(randomSeed),
        "X-Dimensions": `${w}x${h}`,
        "X-Style": style,
        "X-Provider": provider,
      },
    });
  } catch (err: unknown) {
    const msg = sanitizeErrorMessage(err, [validation.apiKey]);
    console.error(`[concept-art][${provider}] error:`, msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
