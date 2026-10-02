export type ProductCategory =
  | "footwear"
  | "apparel"
  | "handbags"
  | "jewelry"
  | "cosmetics"
  | "electronics"
  | "furniture"
  | "accessories"
  | "custom";

export interface FootwearHeelSpecs {
  heelHeight?: string;
  heelHeightPriority?: "both" | "product_only" | "reference_only";
  heelWidth?: string;
  heelAngle?: string;
  heelPosition?: string;
  heelShape?: string;
  heelThickness?: string;
  frontSoleThickness?: string;
  outsolePattern?: string;
}

export interface ProductBlueprint {
  category: ProductCategory;
  subcategory?: string;
  shape: string;
  dimensions?: string;
  proportions: string;
  material: string;
  color: string;
  texture: string;
  components: string[];
  logo?: {
    presence: boolean;
    placement?: string;
    style?: string;
    description?: string;
  };
  stitching?: {
    pattern?: string;
    color?: string;
    contrast?: boolean;
  };
  ornaments?: string[];
  hardware?: {
    type?: string;
    finish?: string;
    color?: string;
  };
  outsole?: {
    material?: string;
    color?: string;
    profile?: string;
    pattern?: string;
  };
  heel?: FootwearHeelSpecs;
  construction: string;
  visualNotes: string;
  confidence: number; // 0.0 - 1.0
}

export interface ProductLocks {
  lockShape: boolean;
  lockStrap: boolean;
  lockOutsole: boolean;
  lockLogo: boolean;
  lockBuckle: boolean;
  lockOrnament: boolean;
  lockMaterial: boolean;
  lockTexture: boolean;
  lockStitching: boolean;
  lockColor: boolean;
  lockProportion: boolean;
  lockConstruction: boolean;
  
  // Footwear-specific heel locks
  lockHeelHeight: boolean;
  lockHeelWidth: boolean;
  lockHeelAngle: boolean;
  lockHeelPosition: boolean;
  lockHeelShape: boolean;
  lockHeelThickness: boolean;
  lockFrontSoleThickness: boolean;
  lockHeelProportion: boolean;
}

export type CameraAngle =
  | "copy_reference"
  | "front"
  | "three_quarter"
  | "side"
  | "top"
  | "low_angle"
  | "high_angle"
  | "macro_detail"
  | "custom";

export type BackgroundSetting =
  | "exact_reference"
  | "similar_reference"
  | "studio_white"
  | "studio_beige"
  | "gradient"
  | "transparent"
  | "lifestyle"
  | "custom";

export type ModelSetting =
  | "without_model"
  | "human_model"
  | "partial_hands"
  | "custom";

export interface HumanModelOptions {
  genderPresentation: "female" | "male" | "androgynous" | "neutral";
  pose: "standing" | "walking" | "sitting" | "relaxed_studio" | "editorial_fashion" | "custom";
  bodyFraming: "feet_only" | "lower_legs" | "full_body" | "mid_shot" | "cropped";
  clothingStyle: "minimalist_monochrome" | "casual_chic" | "formal_luxury" | "streetwear" | "tailored";
  skinVisibility: "minimal" | "natural" | "barefoot_styling";
  productPlacement: "on_foot" | "held_in_hand" | "beside_model" | "hero_foreground";
}

export type MarketplacePreset =
  | "shopee"
  | "tokopedia"
  | "tiktok_shop"
  | "instagram"
  | "amazon"
  | "general"
  | "custom";

export interface MarketplaceConfig {
  name: string;
  aspectRatio: "1:1" | "4:5" | "3:4" | "16:9" | "9:16";
  safeMargins: string;
  productScale: string;
  backgroundPreference: string;
  composition: string;
  description: string;
}

export type AspectRatio = "1:1" | "4:5" | "3:4" | "16:9" | "9:16";

export interface PhotographyDirection {
  modelSetting: ModelSetting;
  modelOptions?: HumanModelOptions;
  cameraAngle: CameraAngle;
  customCameraAngle?: string;
  background: BackgroundSetting;
  customBackground?: string;
  marketplacePreset: MarketplacePreset;
  aspectRatio: AspectRatio;
}

export interface PreservationSettings {
  detailPreservation: number; // 0 - 100, default 100
  referenceStrength: number; // 0 - 100, default 70
  consistencyMode: boolean; // default true
  strictProductMode: boolean; // default true
  ignoreProductDesignFromReference: boolean; // default true
}

export interface UploadedImage {
  id: string;
  name: string;
  dataUrl: string; // base64 or URL
  size: number;
  type: string;
  tag?: "front" | "side" | "back" | "top" | "bottom" | "outsole" | "logo" | "buckle" | "strap" | "detail" | "general";
  width?: number;
  height?: number;
}

export type PipelineStepStatus = "pending" | "running" | "completed" | "failed";

export interface AgentStep {
  id: number;
  key: string;
  title: string;
  description: string;
  status: PipelineStepStatus;
  startedAt?: string;
  completedAt?: string;
  details?: string;
}

export interface ValidationChecks {
  shape: number; // 0 - 100
  color: number;
  material: number;
  logo: number;
  components: number;
  proportions: number;
  heel?: number;
}

export interface ValidationResult {
  score: number; // 0 - 100
  checks: ValidationChecks;
  status: "pass" | "needs_regeneration";
  notes?: string[];
  isFallback?: boolean;
  validatedAt: string;
}

export interface GeneratedOutput {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  prompt: string;
  angle: string;
  consistencyScore: number;
  validation: ValidationResult;
  status: "passed" | "rejected" | "regenerated";
  createdAt: string;
  aspectRatio: AspectRatio;
}

export interface ReferenceAnalysis {
  lightingDirection: string;
  lightQuality: string; // soft diffuse, harsh rim, natural golden
  colorTemperature: string; // 3200k warm, 5500k daylight, cool
  backgroundStyle: string;
  shadowType: string; // soft ground shadow, contact shadow, floating
  framingComposition: string; // centered hero, dynamic diagonal, rule of thirds
  mood: string;
}

export interface StructuredGenerationRequest {
  productBlueprint: ProductBlueprint;
  productLocks: ProductLocks;
  photographyDirection: PhotographyDirection;
  preservationSettings: PreservationSettings;
  referenceAnalysis?: ReferenceAnalysis;
  rawImagesCount: number;
  generationCount: number;
}

export interface GenerationHistoryItem {
  id: string;
  projectName: string;
  createdAt: string;
  category: ProductCategory;
  rawImages: UploadedImage[];
  referenceImages: UploadedImage[];
  blueprint: ProductBlueprint;
  locks: ProductLocks;
  direction: PhotographyDirection;
  preservation: PreservationSettings;
  outputs: GeneratedOutput[];
  averageScore: number;
  isDemo?: boolean;
}
