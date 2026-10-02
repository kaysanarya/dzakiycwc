import { getAIProvider, ProviderOptions } from "./factory";
import { AnalyzeProductInput } from "./provider";
import { ProductBlueprint } from "@/types";

export async function analyzeProduct(
  input: AnalyzeProductInput,
  options?: ProviderOptions
): Promise<ProductBlueprint> {
  const provider = getAIProvider(options);
  return await provider.analyzeProduct(input);
}
