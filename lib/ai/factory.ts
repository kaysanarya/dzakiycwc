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
 * Factory for creating AI Providers (BYOK Pattern).
 * Rule 1: The server NEVER uses API keys from process.env for AI routes.
 * All fallback to process.env has been strictly removed.
 */
export function getAIProvider(options?: ProviderOptions): AIProvider {
  const chosenProvider = options?.provider || "demo";
  const userApiKey = options?.apiKey?.trim();

  // 1. Demo Mode (Runs local SVG compositor, no key required)
  if (chosenProvider === "demo") {
    return new DemoAIProvider();
  }

  // 2. Real AI Providers MUST have user's API key
  if (!userApiKey || userApiKey === "demo_key") {
    throw new Error("Isi API key kamu di pengaturan");
  }

  if (chosenProvider === "openai") {
    return new OpenAIProvider(userApiKey);
  }

  if (chosenProvider === "stability") {
    return new StabilityAIProvider(userApiKey);
  }

  if (chosenProvider === "replicate") {
    return new ReplicateAIProvider(userApiKey);
  }

  if (chosenProvider === "gemini") {
    return new GeminiAIProvider({
      apiKey: userApiKey,
      visionModel: process.env.AI_VISION_MODEL || "gemini-2.0-flash",
      imageModel: process.env.AI_IMAGE_MODEL || "imagen-3.0-generate-002",
      validationModel: process.env.AI_VALIDATION_MODEL || "gemini-2.0-flash",
    });
  }

  throw new Error(`Unsupported AI provider: "${chosenProvider}". Please select openai, stability, replicate, or gemini.`);
}
