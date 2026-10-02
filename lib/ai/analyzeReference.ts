import { getAIProvider } from "./factory";
import { AnalyzeReferenceInput } from "./provider";
import { ReferenceAnalysis } from "@/types";

export async function analyzeReference(
  input: AnalyzeReferenceInput
): Promise<ReferenceAnalysis> {
  const provider = getAIProvider();
  return await provider.analyzeReference(input);
}
