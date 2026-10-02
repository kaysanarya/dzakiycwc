import { getAIProvider, ProviderOptions } from "./factory";
import { ValidateConsistencyInput } from "./provider";
import { ValidationResult } from "@/types";

export async function validateImages(
  input: ValidateConsistencyInput,
  options?: ProviderOptions
): Promise<ValidationResult> {
  const provider = getAIProvider(options);
  return await provider.validateProductConsistency(input);
}
