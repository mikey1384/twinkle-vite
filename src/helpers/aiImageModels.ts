// Keep model IDs and quality capabilities aligned with API constants/aiImage.ts.
export const GPT_IMAGE_2_6_FLARE = 'gpt-image-2.6-flare';
export const GPT_IMAGE_2_6_SUNBURST = 'gpt-image-2.6-sunburst';
export const OPENAI_IMAGE_MODELS = [
  GPT_IMAGE_2_6_FLARE,
  GPT_IMAGE_2_6_SUNBURST,
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

// Mikey 11-07: "2.6 replaces it all". Settings saved before then may still
// hold a 2.5 id; it means the 2.6 model in the same role.
const RETIRED_OPENAI_IMAGE_MODELS: Readonly<Record<string, OpenAiImageModel>> =
  {
    'gpt-image-2.5-flare': GPT_IMAGE_2_6_FLARE,
    'gpt-image-2.5-sunburst': GPT_IMAGE_2_6_SUNBURST
  };

export function upgradeRetiredImageModel<T>(model: T): T | OpenAiImageModel {
  return typeof model === 'string' &&
    Object.hasOwn(RETIRED_OPENAI_IMAGE_MODELS, model)
    ? RETIRED_OPENAI_IMAGE_MODELS[model]
    : model;
}

export function isImage26Model(model: unknown): model is OpenAiImageModel {
  return model === GPT_IMAGE_2_6_FLARE || model === GPT_IMAGE_2_6_SUNBURST;
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
  const current = upgradeRetiredImageModel(model);
  if (isOpenAiImageModel(current)) return current;
  return previousResponseId || previousImageId || referenceImageB64
    ? GPT_IMAGE_2_6_SUNBURST
    : GPT_IMAGE_2_6_FLARE;
}

export function supportsImageQuality(model: string, quality: AiImageQuality) {
  return (
    isImage26Model(model) ||
    quality === 'low' ||
    quality === 'medium' ||
    quality === 'high'
  );
}

export function getImageModelLabel(model?: string) {
  const current = upgradeRetiredImageModel(model);
  return current === GPT_IMAGE_2_6_SUNBURST
    ? 'Sunburst 2.6'
    : current === 'gpt-image-2'
      ? 'Image 2'
      : 'Flare 2.6';
}

export interface AiImageGenerationEstimate {
  model: OpenAiImageModel;
  quality: AiImageQuality;
  energyUnits: number;
  fullBatteryUnits: number;
}
