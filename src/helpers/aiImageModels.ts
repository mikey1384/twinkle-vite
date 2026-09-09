// Keep model IDs and quality capabilities aligned with API constants/aiImage.ts.
export const GPT_IMAGE_2_5_FLARE = 'gpt-image-2.5-flare';
export const GPT_IMAGE_2_5_SUNBURST = 'gpt-image-2.5-sunburst';
export const OPENAI_IMAGE_MODELS = [
  GPT_IMAGE_2_5_FLARE,
  GPT_IMAGE_2_5_SUNBURST,
  'gpt-image-2'
] as const;
export type OpenAiImageModel = (typeof OPENAI_IMAGE_MODELS)[number];
export const AI_IMAGE_QUALITIES = [
  'low',
  'medium',
  'high',
  'xhigh',
  'max'
] as const;
export type AiImageQuality = (typeof AI_IMAGE_QUALITIES)[number];

export function isImage25Model(model: string) {
  return model === GPT_IMAGE_2_5_FLARE || model === GPT_IMAGE_2_5_SUNBURST;
}

export function isOpenAiImageModel(model: unknown): model is OpenAiImageModel {
  return OPENAI_IMAGE_MODELS.includes(model as OpenAiImageModel);
}

export function isAiImageQuality(quality: unknown): quality is AiImageQuality {
  return AI_IMAGE_QUALITIES.includes(quality as AiImageQuality);
}

export function resolveOpenAiImageModel({
  model,
  previousResponseId,
  previousImageId,
  referenceImageB64
}: {
  model?: unknown;
  previousResponseId?: string;
  previousImageId?: string;
  referenceImageB64?: string;
}): OpenAiImageModel {
  if (isOpenAiImageModel(model)) return model;
  return previousResponseId || previousImageId || referenceImageB64
    ? GPT_IMAGE_2_5_SUNBURST
    : GPT_IMAGE_2_5_FLARE;
}

export function supportsImageQuality(model: string, quality: AiImageQuality) {
  return (
    isImage25Model(model) ||
    quality === 'low' ||
    quality === 'medium' ||
    quality === 'high'
  );
}

export function getImageModelLabel(model?: string) {
  return model === GPT_IMAGE_2_5_SUNBURST
    ? 'Sunburst 2.5'
    : model === 'gpt-image-2'
      ? 'Image 2'
      : 'Flare 2.5';
}

export interface AiImageGenerationEstimate {
  model: OpenAiImageModel;
  quality: AiImageQuality;
  energyUnits: number;
  fullBatteryUnits: number;
}
