import { sanitizeErrorMessage } from "@/lib/auth/serverAuth";

/**
 * Safely extracts and parses JSON from AI provider responses.
 * - Strips markdown code fences (```json ... ```)
 * - Attempts direct parse, then matches outermost JSON object/array
 * - Returns structured user-friendly error on failure
 * - All errors pass through sanitizeErrorMessage to avoid key leakage
 */
export function parseAIJsonResponse<T>(
  content: string | null | undefined,
  contextMessage = "Format respons AI tidak valid",
  apiKeyToMask?: string
): T {
  if (!content || typeof content !== "string" || !content.trim()) {
    const errorMsg = sanitizeErrorMessage(
      `${contextMessage}: Respons dari AI kosong atau tidak ditemukan.`,
      apiKeyToMask ? [apiKeyToMask] : undefined
    );
    throw new Error(errorMsg);
  }

  let text = content.trim();

  // Strip markdown code fences if wrapped in ```json ... ``` or ``` ... ```
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  }

  // 1. Try direct parse
  try {
    return JSON.parse(text) as T;
  } catch {
    // 2. Try to locate outermost JSON object { ... } or array [ ... ]
    const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        // Fall through
      }
    }

    const safeMsg = sanitizeErrorMessage(
      `${contextMessage}: Format data dari AI tidak valid. Silakan coba kembali.`,
      apiKeyToMask ? [apiKeyToMask] : undefined
    );
    throw new Error(safeMsg);
  }
}
