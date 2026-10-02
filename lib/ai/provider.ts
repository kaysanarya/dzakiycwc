import {
  ProductBlueprint,
  ProductLocks,
  PhotographyDirection,
  PreservationSettings,
  ReferenceAnalysis,
  UploadedImage,
  GeneratedOutput,
  ValidationResult,
  ProductCategory,
} from "@/types";

export interface AIProviderConfig {
  apiKey?: string;
  visionModel?: string;
  imageModel?: string;
  validationModel?: string;
}

export interface AnalyzeProductInput {
  images: UploadedImage[];
  categoryHint?: ProductCategory;
  userNotes?: string;
}

export interface AnalyzeReferenceInput {
  images: UploadedImage[];
}

export interface GenerateImagesInput {
  blueprint: ProductBlueprint;
  locks: ProductLocks;
  direction: PhotographyDirection;
  preservation: PreservationSettings;
  referenceAnalysis?: ReferenceAnalysis;
  sourceImages: UploadedImage[];
  referenceImages?: UploadedImage[];
  count: number;
  signal?: AbortSignal;
}

export interface ValidateConsistencyInput {
  sourceImages: UploadedImage[];
  generatedImageUrl: string;
  blueprint: ProductBlueprint;
  locks: ProductLocks;
  angle: string;
}

export interface AIProvider {
  name: string;
  isDemo: boolean;
  analyzeProduct(input: AnalyzeProductInput): Promise<ProductBlueprint>;
  analyzeReference(input: AnalyzeReferenceInput): Promise<ReferenceAnalysis>;
  generateProductImages(input: GenerateImagesInput): Promise<GeneratedOutput[]>;
  validateProductConsistency(input: ValidateConsistencyInput): Promise<ValidationResult>;
}
