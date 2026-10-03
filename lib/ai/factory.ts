import { AIProvider } from "./provider";
import { DemoAIProvider } from "./demoProvider";
import { GeminiAIProvider } from "./geminiProvider";
import { OpenAIProvider } from "./openAIProvider";
import { StabilityAIProvider } from "./stabilityProvider";
import { ReplicateAIProvider } from "./replicateProvider";

export interface ProviderOptions {
  provider?: "openai" | "stability" | "replicate" | "gemini" | "demo" | string;
  apiKey?: string;
}

/**
 * Factory for creating AI Providers.
 * API keys are always sourced from server-side environment variables via serverAuth.
 * The factory accepts the resolved provider + key from the route handler.
 */
export function getAIProvider(options?: ProviderOptions): AIProvider {
  const chosenProvider = options?.provider || "demo";
  const apiKey = options?.apiKey?.trim();

  // 1. Demo Mode (Runs local SVG compositor, no key required)
  if (chosenProvider === "demo" || !apiKey) {
    return new DemoAIProvider();
  }

  if (chosenProvider === "openai") {
    return new OpenAIProvider(apiKey);
  }

  if (chosenProvider === "stability") {
    return new StabilityAIProvider(apiKey);
  }

  if (chosenProvider === "replicate") {
    return new ReplicateAIProvider(apiKey);
  }

  if (chosenProvider === "gemini") {
    const rawVision = process.env.AI_VISION_MODEL?.trim();
    // Default to probe-validated model; skip stale/quota-exhausted defaults
    const visionModel = (!rawVision || rawVision === "gemini-2.0-flash" || rawVision === "gemini-3.8-flash" || rawVision.includes("1.5"))
      ? "gemini-3.5-flash"  // probe 2026-10-04: 3.5-flash=200OK, 3.8-flash=429
      : rawVision;

    const rawImage = process.env.AI_IMAGE_MODEL?.trim();
    // Only use imageModel if explicitly set and valid — do NOT default to imagen (not available on free tier)
    const imageModel = rawImage || "";

    const rawValidation = process.env.AI_VALIDATION_MODEL?.trim();
    const validationModel = (!rawValidation || rawValidation === "gemini-2.0-flash" || rawValidation === "gemini-3.8-flash" || rawValidation.includes("1.5"))
      ? "gemini-3.5-flash"
      : rawValidation;

    // AI_JUDGE=on enables vision validation; off=skip judge, mark as "unverified" (saves quota)
    const judgeEnabled = (process.env.AI_JUDGE ?? "off").toLowerCase() === "on";

    console.log(
      `[factory/gemini] visionModel=${visionModel} | imageModel=${imageModel || "(none-pollinations)"} | judge=${judgeEnabled ? "on" : "off"}`
    );

    return new GeminiAIProvider({
      apiKey,
      visionModel,
      imageModel,
      validationModel,
      judgeEnabled,
    });
  }

  // Unknown provider: fall back to demo gracefully
  console.warn(`[factory] Unknown provider "${chosenProvider}", falling back to demo.`);
  return new DemoAIProvider();
}
