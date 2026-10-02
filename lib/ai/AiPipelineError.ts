/**
 * Typed error class for the AI image generation pipeline.
 * Every error thrown from generate path must use this class so the route
 * handler can map it to the correct HTTP status and structured response.
 */
export class AiPipelineError extends Error {
  stage: "auth" | "removeBackground" | "mask" | "provider" | "timeout";
  provider?: string;
  /** HTTP status from the upstream provider (if applicable) */
  status?: number;

  constructor(
    message: string,
    stage: "auth" | "removeBackground" | "mask" | "provider" | "timeout",
    options?: { provider?: string; status?: number; cause?: unknown }
  ) {
    super(message);
    this.name = "AiPipelineError";
    this.stage = stage;
    this.provider = options?.provider;
    this.status = options?.status;
    // Preserve stack chain when possible (Node 16.9+ supports `cause`)
    if (options?.cause !== undefined) {
      (this as unknown as { cause: unknown }).cause = options.cause;
    }
  }
}

/**
 * Maps an AiPipelineError to the appropriate HTTP status code.
 * - auth (401/403)   → 401
 * - quota (402/429)  → 429
 * - provider error   → 502
 * - timeout          → 504
 * - mask/bg removal  → 422
 * - default          → 500
 */
export function pipelineErrorToStatus(err: AiPipelineError): number {
  if (err.stage === "auth") return err.status === 403 ? 403 : 401;
  if (err.stage === "timeout") return 504;
  if (err.stage === "removeBackground") return 422;
  if (err.stage === "mask") return 422;
  if (err.stage === "provider") {
    if (err.status === 402 || err.status === 429) return err.status;
    if (err.status && err.status >= 500) return 502;
    if (err.status === 401 || err.status === 403) return err.status;
  }
  return 500;
}
