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
    return new GeminiAIProvider({
      apiKey,
      visionModel: process.env.AI_VISION_MODEL || "gemini-3.8-flash",
      imageModel: process.env.AI_IMAGE_MODEL || "gemini-3.1-flash-image",
      validationModel: process.env.AI_VALIDATION_MODEL || "gemini-3.8-flash",
    });
  }

  // Unknown provider: fall back to demo gracefully
  console.warn(`[factory] Unknown provider "${chosenProvider}", falling back to demo.`);
  return new DemoAIProvider();
}
