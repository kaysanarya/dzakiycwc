import { ProductBlueprint, ProductCategory, UploadedImage } from "@/types";
import { analyzeProduct } from "./analyzeProduct";
import { ProviderOptions } from "./factory";

export interface BuildBlueprintOptions {
  images: UploadedImage[];
  category?: ProductCategory;
  userNotes?: string;
  existingBlueprint?: Partial<ProductBlueprint>;
}

export async function buildBlueprint(
  options: BuildBlueprintOptions,
  providerOptions?: ProviderOptions
): Promise<ProductBlueprint> {
  // If an authoritative existing blueprint is already provided, finalize and merge
  if (
    options.existingBlueprint &&
    options.existingBlueprint.shape &&
    options.existingBlueprint.material &&
    options.existingBlueprint.category
  ) {
    const existing = options.existingBlueprint as ProductBlueprint;
    return {
      ...existing,
      category: options.category || existing.category,
      visualNotes: options.userNotes
        ? `${existing.visualNotes || ""} | Constraints: ${options.userNotes}`.trim()
        : existing.visualNotes,
    };
  }

  const analyzed = await analyzeProduct(
    {
      images: options.images,
      categoryHint: options.category,
      userNotes: options.userNotes,
    },
    providerOptions
  );

  if (options.existingBlueprint) {
    return {
      ...analyzed,
      ...options.existingBlueprint,
    };
  }

  return analyzed;
}
