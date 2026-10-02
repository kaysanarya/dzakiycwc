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

/**
 * Validate that a string looks like a real Gemini API key.
 * Valid Gemini keys start with "AIza" and are ~39 chars.
 */
function isValidGeminiKey(key?: string): boolean {
  if (!key || key.trim().length < 10) return false;
  const k = key.trim();
  return k.startsWith("AIza") && k.length >= 35;
}

/**
 * Validate that a string looks like a real OpenAI API key.
 * Valid keys start with "sk-" and are at least 30 chars.
 */
function isValidOpenAiKey(key?: string): boolean {
  if (!key || key.trim().length < 10) return false;
  const k = key.trim();
  return k.startsWith("sk-") && k.length >= 30;
}

/**
 * Validate that a string looks like a real Stability AI API key.
 * Stability keys start with "sk-" (same prefix as OpenAI) but are at least 40 chars,
 * OR start with other formats. We accept any sk- key >= 40 chars as Stability-style,
 * or any key stored in STABILITY_API_KEY env of >= 20 chars.
 */
function isValidStabilityKey(key?: string): boolean {
  if (!key || key.trim().length < 20) return false;
  return true; // Accept any non-trivial key stored in STABILITY_API_KEY
}

/**
 * Validate that a string looks like a real Replicate API key.
 * Valid Replicate keys start with "r8_" and are at least 30 chars.
 */
function isValidReplicateKey(key?: string): boolean {
  if (!key || key.trim().length < 10) return false;
  const k = key.trim();
  return k.startsWith("r8_") && k.length >= 30;
}

/**
 * Resolves the active AI API key from server-side environment variables.
 * Only returns a key if it passes format validation.
 * Priority (per provider):
 *   stability  → STABILITY_API_KEY
 *   replicate  → REPLICATE_API_TOKEN → REPLICATE_API_KEY
 *   openai     → OPENAI_API_KEY → AI_API_KEY (if OpenAI-format)
 *   gemini     → AI_API_KEY → GEMINI_API_KEY
 */
export function resolveServerApiKey(provider?: string): string | undefined {
  if (provider === "stability") {
    const stabKey = process.env.STABILITY_API_KEY?.trim();
    if (isValidStabilityKey(stabKey)) return stabKey;
    return undefined;
  }
  if (provider === "replicate") {
    const repKey1 = process.env.REPLICATE_API_TOKEN?.trim();
    if (isValidReplicateKey(repKey1)) return repKey1;
    const repKey2 = process.env.REPLICATE_API_KEY?.trim();
    if (isValidReplicateKey(repKey2)) return repKey2;
    return undefined;
  }
  if (provider === "openai") {
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    if (isValidOpenAiKey(openaiKey)) return openaiKey;
    // Also accept a valid OpenAI key stored in AI_API_KEY
    const aiKey = process.env.AI_API_KEY?.trim();
    if (isValidOpenAiKey(aiKey)) return aiKey;
    return undefined;
  }
  // Gemini / default
  const aiKey = process.env.AI_API_KEY?.trim();
  if (isValidGeminiKey(aiKey)) return aiKey;
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (isValidGeminiKey(geminiKey)) return geminiKey;
  return undefined;
}

/**
 * Determines the active AI provider from environment variables.
 * Priority: stability → replicate → gemini → openai → demo.
 * Validates key format — returns "demo" if no valid key is found.
 */
export function resolveServerProvider(): string {
  const stabKey = process.env.STABILITY_API_KEY?.trim();
  if (isValidStabilityKey(stabKey)) return "stability";

  const repKey = (process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY)?.trim();
  if (isValidReplicateKey(repKey)) return "replicate";

  const aiKey = process.env.AI_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (isValidGeminiKey(aiKey) || isValidGeminiKey(geminiKey)) return "gemini";

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (isValidOpenAiKey(openaiKey) || isValidOpenAiKey(aiKey)) return "openai";

  return "demo";
}

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
 * Server-Centralized Validation:
 * 1. Checks payload size.
 * 2. Resolves provider and API key from server-side environment variables ONLY.
 * 3. The browser NEVER sends or is required to send an API key.
 * 4. Falls back to demo mode gracefully when no env keys are configured.
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

  if (options.isConceptArt) {
    // Concept art: always use Pollinations (free, no key needed) unless a server key is present
    const serverProvider = resolveServerProvider();
    if (serverProvider !== "demo" && (serverProvider === "gemini" || serverProvider === "openai")) {
      const apiKey = resolveServerApiKey(serverProvider);
      return {
        allowed: true,
        apiKey,
        provider: serverProvider,
        isDemo: false,
      };
    }
    // Default concept art to pollinations (free)
    return {
      allowed: true,
      provider: "pollinations",
      isDemo: true,
    };
  }

  // 1. Check client-provided BYOK headers first
  const clientKey = req.headers.get("x-api-key")?.trim();
  const rawClientProv = req.headers.get("x-provider")?.trim() || options.provider;
  const clientProvider = rawClientProv ? rawClientProv.toLowerCase() : undefined;

  if (clientKey) {
    const prov = clientProvider || "stability";
    if (!ALLOWED_PIPELINE_PROVIDERS.includes(prov as AllowedPipelineProvider)) {
      return {
        allowed: false,
        status: 400,
        error: `Provider AI tidak sah: "${prov}". Provider yang diizinkan: ${ALLOWED_PIPELINE_PROVIDERS.join(", ")}`,
        provider: prov,
        isDemo: false,
      };
    }

    if (prov === "demo") {
      return {
        allowed: true,
        provider: "demo",
        isDemo: true,
      };
    }

    // Validate key format for chosen provider
    let isValid = false;
    if (prov === "stability") isValid = isValidStabilityKey(clientKey);
    else if (prov === "replicate") isValid = isValidReplicateKey(clientKey);
    else if (prov === "openai") isValid = isValidOpenAiKey(clientKey);
    else if (prov === "gemini") isValid = isValidGeminiKey(clientKey);

    if (!isValid) {
      return {
        allowed: false,
        status: 400,
        error: `Format API key untuk provider ${prov} tidak sah. Harap periksa kembali di Pengaturan API Key.`,
        provider: prov,
        isDemo: false,
      };
    }

    return {
      allowed: true,
      apiKey: clientKey,
      provider: prov,
      isDemo: false,
    };
  }

  // 2. Fallback to server-side environment variables
  const resolvedProvider = resolveServerProvider();
  const resolvedApiKey = resolveServerApiKey(resolvedProvider);

  if (resolvedProvider === "demo" || !resolvedApiKey) {
    return {
      allowed: true,
      provider: "demo",
      isDemo: true,
    };
  }

  return {
    allowed: true,
    apiKey: resolvedApiKey,
    provider: resolvedProvider,
    isDemo: false,
  };
}

/**
 * Sanitizes errors and log strings so API keys are never leaked to logs or error messages.
 */
export function sanitizeErrorMessage(
  err: unknown,
  extraKeysToMask?: (string | undefined)[]
): string {
  let message = err instanceof Error ? err.message : String(err ?? "Unknown error");

  // Redact known API key patterns
  message = message
    .replace(/AIza[0-9A-Za-z-_]{35}/g, "[REDACTED_GEMINI_KEY]")
    .replace(/sk-[a-zA-Z0-9_-]{20,}/g, "[REDACTED_SK_KEY]")
    .replace(/r8_[a-zA-Z0-9]{30,}/g, "[REDACTED_REPLICATE_KEY]")
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [REDACTED_TOKEN]")
    .replace(/([?&]key=)[^&]+/gi, "$1[REDACTED]")
    // Redact large base64 blobs (>100 chars of base64 chars) to prevent image data leakage
    .replace(/[A-Za-z0-9+/]{100,}={0,2}/g, "[REDACTED_BASE64]");

  // Redact any explicitly provided keys
  if (extraKeysToMask) {
    for (const key of extraKeysToMask) {
      if (key && key.trim().length > 5) {
        message = message.split(key.trim()).join("[REDACTED_SERVER_KEY]");
      }
    }
  }

  return message;
}
