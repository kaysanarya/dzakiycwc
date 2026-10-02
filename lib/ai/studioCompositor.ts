/**
 * VELLUM Studio Compositor Engine (DEPRECATED & DISABLED)
 * 
 * Notice: Naive static canvas layering and sticker compositing have been permanently removed
 * in favor of true generative AI inpainting and background synthesis (SDXL, Stability Inpaint,
 * Gemini Multimodal Inpaint, and ControlNet).
 * 
 * This file is retained only for backward type compatibility.
 */

export interface StudioCompositeParams {
  productDataUrl: string;
  referenceDataUrl?: string;
  background?: string;
  customBackground?: string;
  aspectRatio?: string;
  variationIndex?: number;
  angleName?: string;
}

/**
 * @deprecated Naive canvas layering has been removed. Use generative inpainting pipeline instead.
 */
export function createStudioComposite(params: StudioCompositeParams): string {
  // Return the raw or transparent product image directly without naive SVG sticker compositing
  return params.productDataUrl;
}
