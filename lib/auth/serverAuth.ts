import { NextRequest } from "next/server";

export const ALLOWED_PIPELINE_PROVIDERS = [
  "demo",
  "openai",
  "stability",
  "replicate",
  "gemini",
] as const;

export type AllowedPipelineProvider = typeof ALLOWED_PIPELINE_PROVIDERS[number];

export const ALLOWED_CONCEPT_ART_PROVIDERS = [
  "pollinations",
  "openai",
  "gemini",
] as const;

export type AllowedConceptArtProvider = typeof ALLOWED_CONCEPT_ART_PROVIDERS[number];

// Maximum allowed payload body size (15MB)
export const MAX_BODY_SIZE_BYTES = 15 * 1024 * 1024;

export interface ValidateApiResult {
  allowed: boolean;
  status?: number;
  error?: string;
  apiKey?: string;
  provider: string;
  isDemo: boolean;
}

/**
 * Safely reads and parses a JSON request body stream with a hard byte-count limit.
 * If the incoming stream exceeds maxBytes (e.g. via Transfer-Encoding: chunked),
 * the stream reader is cancelled immediately to prevent V8 memory exhaustion / DoS.
 */
export async function readJsonBodyWithLimit<T = unknown>(
  req: NextRequest,
  maxBytes: number = MAX_BODY_SIZE_BYTES
): Promise<{ data: T; error?: never; status?: never } | { data?: never; error: string; status: number }> {
  // 1. Fast-path check Content-Length header
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const parsedLength = parseInt(contentLength, 10);
    if (Number.isNaN(parsedLength) || parsedLength > maxBytes) {
      return {
        error: "Ukuran request melebihi batas maksimum (15MB).",
        status: 413,
      };
    }
  }

  // 2. Empty body check
  if (!req.body) {
    return { data: {} as T };
  }

  // 3. Chunked / stream reader with early cancellation on byte limit violation
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          // Immediately abort stream reading to avoid buffering oversized payload into V8 memory
          await reader.cancel("Payload Too Large");
          return {
            error: "Ukuran request melebihi batas maksimum (15MB).",
            status: 413,
          };
        }
        chunks.push(value);
      }
    }
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "Gagal membaca aliran data permintaan.",
      status: 400,
    };
  }

  // 4. Assemble and parse JSON
  try {
    const totalBuffer = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      totalBuffer.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const text = new TextDecoder("utf-8").decode(totalBuffer);
    const data = JSON.parse(text) as T;
    return { data };
  } catch {
    return {
      error: "Format JSON tidak sah dalam body request.",
      status: 400,
    };
  }
}

/**
 * BYOK (Bring Your Own Key) Server Validation:
 * 1. Checks payload size (Content-Length and optional measured body size).
 * 2. Validates provider against strict whitelist (Condition 5).
 * 3. Allows demo mode / free pollinations without any key (Condition 3).
 * 4. Extracts API key strictly from the `x-api-key` header (Rule 2).
 * 5. Rejects real AI provider requests without key with 400 "Isi API key kamu di pengaturan" (Rule 3).
 */
export function validateApiKeyAndProvider(
  req: NextRequest,
  options: {
    provider?: string;
    isConceptArt?: boolean;
    bodySize?: number;
  }
): ValidateApiResult {
  // 1. Validate Body Size (Content-Length and measured body size)
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const parsedLength = parseInt(contentLength, 10);
    if (Number.isNaN(parsedLength) || parsedLength > MAX_BODY_SIZE_BYTES) {
      return {
        allowed: false,
        status: 413,
        error: "Ukuran request melebihi batas maksimum (15MB).",
        provider: options.provider || "unknown",
        isDemo: false,
      };
    }
  }

  if (typeof options.bodySize === "number" && options.bodySize > MAX_BODY_SIZE_BYTES) {
    return {
      allowed: false,
      status: 413,
      error: "Ukuran request melebihi batas maksimum (15MB).",
      provider: options.provider || "unknown",
      isDemo: false,
    };
  }

  // 2. Validate Provider against allowed whitelist
  if (options.isConceptArt) {
    const prov = options.provider || "pollinations";
    if (!ALLOWED_CONCEPT_ART_PROVIDERS.includes(prov as AllowedConceptArtProvider)) {
      return {
        allowed: false,
        status: 400,
        error: `Provider AI tidak valid: "${options.provider}". Provider yang diizinkan untuk concept art: ${ALLOWED_CONCEPT_ART_PROVIDERS.join(", ")}`,
        provider: prov,
        isDemo: false,
      };
    }

    // Pollinations is free and requires no key
    if (prov === "pollinations") {
      return {
        allowed: true,
        provider: prov,
        isDemo: true,
      };
    }

    // OpenAI or Gemini in concept art requires user's API key
    const apiKey = req.headers.get("x-api-key")?.trim();
    if (!apiKey || apiKey === "demo_key") {
      return {
        allowed: false,
        status: 400,
        error: "Isi API key kamu di pengaturan",
        provider: prov,
        isDemo: false,
      };
    }

    return {
      allowed: true,
      apiKey,
      provider: prov,
      isDemo: false,
    };
  }

  // Main pipeline (analyze, generate, validate)
  const prov = options.provider || "demo";
  if (!ALLOWED_PIPELINE_PROVIDERS.includes(prov as AllowedPipelineProvider)) {
    return {
      allowed: false,
      status: 400,
      error: `Provider AI tidak valid: "${options.provider}". Provider yang diizinkan: ${ALLOWED_PIPELINE_PROVIDERS.join(", ")}`,
      provider: prov,
      isDemo: false,
    };
  }

  // Demo mode runs local SVG compositor without any key (Condition 3)
  if (prov === "demo") {
    return {
      allowed: true,
      provider: "demo",
      isDemo: true,
    };
  }

  // Real AI provider requires user's API key via x-api-key header (Rule 2 & 3)
  const apiKey = req.headers.get("x-api-key")?.trim();
  if (!apiKey || apiKey === "demo_key") {
    return {
      allowed: false,
      status: 400,
      error: "Isi API key kamu di pengaturan",
      provider: prov,
      isDemo: false,
    };
  }

  return {
    allowed: true,
    apiKey,
    provider: prov,
    isDemo: false,
  };
}

/**
 * Sanitizes errors and log strings so API keys are never leaked to logs or error messages (Rule 6).
 */
export function sanitizeErrorMessage(
  err: unknown,
  extraKeysToMask?: (string | undefined)[]
): string {
  let message = err instanceof Error ? err.message : String(err ?? "Unknown error");

  // Redact known API key patterns
  message = message
    .replace(/AIza[0-9A-Za-z-_]{35}/g, "[REDACTED_GEMINI_KEY]")
    .replace(/sk-[a-zA-Z0-9_-]{20,}/g, "[REDACTED_OPENAI_KEY]")
    .replace(/r8_[a-zA-Z0-9]{30,}/g, "[REDACTED_REPLICATE_KEY]")
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [REDACTED_TOKEN]")
    .replace(/([?&]key=)[^&]+/gi, "$1[REDACTED]");

  // Redact any explicitly provided user keys
  if (extraKeysToMask) {
    for (const key of extraKeysToMask) {
      if (key && key.trim().length > 5) {
        message = message.split(key.trim()).join("[REDACTED_USER_KEY]");
      }
    }
  }

  return message;
}
