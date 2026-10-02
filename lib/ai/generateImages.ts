import { getAIProvider, ProviderOptions } from "./factory";
import { GenerateImagesInput } from "./provider";
import { GeneratedOutput } from "@/types";

export async function generateImages(
  input: GenerateImagesInput,
  options?: ProviderOptions
): Promise<GeneratedOutput[]> {
  const provider = getAIProvider(options);
  return await provider.generateProductImages(input);
}
