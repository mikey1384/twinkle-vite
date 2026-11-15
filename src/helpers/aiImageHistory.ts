// The member's own AI image history (API: controllers/content/routes/aiImage.ts
// /history, helpers/ai/imageHistory.ts). Every image they make through the
// shared image route is kept: the image maker, image edits, Picture Day,
// Zero/Ciel crew pictures and Build app images.

export type AIImageHistoryStatus = 'processing' | 'completed' | 'failed';
// generator: Make Images; edit: the image editor; thumbnail: Make Images for
// a Build thumbnail; zero_ciel: a crew-chat picture by Zero or Ciel.
export type AIImageHistorySource =
  | 'generator'
  | 'edit'
  | 'thumbnail'
  | 'zero_ciel'
  | 'picture_day'
  | 'build_app';

export interface AIImageHistoryItem {
  id: number;
  status: AIImageHistoryStatus;
  requestId: string | null;
  source: AIImageHistorySource;
  buildId: number | null;
  prompt: string;
  engine: string | null;
  model: string | null;
  quality: string | null;
  isFollowUp: boolean;
  // S3 key, served through CloudFront; null until completed
  path: string | null;
  createdAt: number;
  completedAt: number | null;
}

// The sources a Make Images window picks back up when the member comes back
// (another tab, device, or after a reload): its own kind of request only.
// Picture Day, Build apps and Zero/Ciel show their own in-progress state.
export function resumableAIImageSources(
  purpose?: 'buildThumbnail'
): AIImageHistorySource[] {
  return purpose === 'buildThumbnail' ? ['thumbnail'] : ['generator', 'edit'];
}

export function findResumableAIImage(
  images: AIImageHistoryItem[] | null | undefined,
  sources: AIImageHistorySource[]
) {
  return (
    (images || []).find(
      (image) => image.status === 'processing' && sources.includes(image.source)
    ) || null
  );
}

export function mergeAIImageHistoryPages(
  current: AIImageHistoryItem[],
  next: AIImageHistoryItem[]
) {
  const seen = new Set(current.map((image) => image.id));
  return [...current, ...next.filter((image) => !seen.has(image.id))];
}

// The first page again, keeping any older pages already loaded.
export function replaceAIImageHistoryFirstPage(
  current: AIImageHistoryItem[],
  firstPage: AIImageHistoryItem[]
) {
  const firstIds = new Set(firstPage.map((image) => image.id));
  const oldest = firstPage.length
    ? Math.min(...firstPage.map((image) => image.id))
    : Infinity;
  return [
    ...firstPage,
    ...current.filter((image) => !firstIds.has(image.id) && image.id < oldest)
  ];
}

export function describeAIImageSource(image: AIImageHistoryItem) {
  if (image.source === 'picture_day') return 'Picture Day';
  if (image.source === 'build_app') return 'In an app';
  if (image.source === 'zero_ciel') return 'Zero/Ciel';
  if (image.source === 'thumbnail') return 'Thumbnail';
  return image.source === 'edit' || image.isFollowUp ? 'Edit' : '';
}

// Image collections (Cloudstar 10-27, Mikey 11-15; API helpers/ai/
// imageCollections.ts): a member's named set of My Images pictures plus a
// note, picked in the image maker like a Zero/Ciel topic. The server sends
// the pictures as reference pictures and adds the note to the prompt.
export const AI_IMAGE_COLLECTION_NAME_MAX = 60;
export const AI_IMAGE_COLLECTION_NOTE_MAX = 1000;
export const AI_IMAGE_COLLECTION_IMAGES_MAX = 6;

export interface AIImageCollection {
  id: number;
  name: string;
  note: string;
  revision: number;
  images: { id: number; path: string }[];
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number | null;
}

// Must match buildAiImageCollectionKey in the API: it is part of the image
// request fingerprint both sides compute.
export function buildAIImageCollectionKey({
  collectionId,
  collectionRevision
}: {
  collectionId?: number | null;
  collectionRevision?: number | null;
}) {
  const id = Number(collectionId);
  if (!Number.isSafeInteger(id) || id <= 0) return '';
  const revision = Math.max(Math.floor(Number(collectionRevision) || 0), 0);
  return `collection:${id}:${revision}`;
}
