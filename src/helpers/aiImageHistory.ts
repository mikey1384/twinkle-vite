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
// "what to keep the same" note, picked in the image maker like a Zero/Ciel
// topic. v2 (Mikey 11-16): every picture has a job (a character, an art
// style, a place, a thing or logo, or something else) with an optional name
// and note, and up to three collections can be used together. The server
// sends the pictures as reference pictures and tells the model each one's job.
export const AI_IMAGE_COLLECTION_NAME_MAX = 60;
export const AI_IMAGE_COLLECTION_NOTE_MAX = 1000;
export const AI_IMAGE_COLLECTION_LABEL_MAX = 60;
export const AI_IMAGE_COLLECTION_PICTURE_NOTE_MAX = 300;
export const AI_IMAGE_COLLECTION_IMAGES_MAX = 8;
export const AI_IMAGE_COLLECTIONS_COMBINE_MAX = 3;
// collection pictures in one request (the API refuses more)
export const AI_IMAGE_COLLECTION_REFERENCES_MAX = 12;

export type AIImageCollectionRole =
  | 'character'
  | 'style'
  | 'place'
  | 'object'
  | 'other';

export const AI_IMAGE_COLLECTION_ROLES: {
  role: AIImageCollectionRole;
  label: string;
  icon: string;
  // what the AI does with a picture in this job, in a kid's words
  help: string;
  // a name only makes sense for someone or something
  named: boolean;
  namePlaceholder: string;
  notePlaceholder: string;
}[] = [
  {
    role: 'character',
    label: 'Character',
    icon: 'user',
    help: 'Keeps who this is the same: face, hair, clothes and colors.',
    named: true,
    namePlaceholder: 'Name, like Mina',
    notePlaceholder: 'What to keep, like her red scarf'
  },
  {
    role: 'style',
    label: 'Art style',
    icon: 'palette',
    help: 'Draws new pictures in this style, without copying what is in it.',
    named: false,
    namePlaceholder: '',
    notePlaceholder: 'What to keep, like the soft colors'
  },
  {
    role: 'place',
    label: 'Place',
    icon: 'tree',
    help: 'Uses this place as the setting.',
    named: true,
    namePlaceholder: 'Name, like Sky Town',
    notePlaceholder: 'What to keep, like the floating islands'
  },
  {
    role: 'object',
    label: 'Thing or logo',
    icon: 'tag',
    help: 'Keeps its shape, colors and letters exactly the same.',
    named: true,
    namePlaceholder: 'Name, like Star Badge',
    notePlaceholder: 'What to keep, like the gold edge'
  },
  {
    role: 'other',
    label: 'Other',
    icon: 'lightbulb',
    help: 'Uses only what you write below.',
    named: false,
    namePlaceholder: '',
    notePlaceholder: 'What to take from it, like its sunset colors'
  }
];

export function getAIImageCollectionRole(role?: string | null) {
  return (
    AI_IMAGE_COLLECTION_ROLES.find((entry) => entry.role === role) ||
    AI_IMAGE_COLLECTION_ROLES[0]
  );
}

export interface AIImageCollectionImage {
  id: number;
  path: string;
  role: AIImageCollectionRole;
  label: string;
  note: string;
}

export interface AIImageCollection {
  id: number;
  name: string;
  note: string;
  revision: number;
  images: AIImageCollectionImage[];
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number | null;
}

// A collection as the server sent it. An API from before v2 sends pictures
// without a job, name or note: they are characters with neither, which is
// what the API's migration makes them.
export function normalizeAIImageCollection(
  collection: AIImageCollection
): AIImageCollection {
  if (!collection || typeof collection !== 'object') return collection;
  return {
    ...collection,
    note: collection.note || '',
    images: (Array.isArray(collection.images) ? collection.images : []).map(
      (image) => ({
        ...image,
        role: getAIImageCollectionRole(image?.role).role,
        label: typeof image?.label === 'string' ? image.label : '',
        note: typeof image?.note === 'string' ? image.note : ''
      })
    )
  };
}

// What an image request sends for the picked collections, in order. The
// first one also goes as collectionId/collectionRevision, which an API from
// before v2 reads.
export function buildAIImageCollectionRequest(
  collections: Pick<AIImageCollection, 'id' | 'revision'>[]
) {
  if (!collections.length) return {};
  return {
    collections: collections.map(({ id, revision }) => ({ id, revision })),
    collectionId: collections[0].id,
    collectionRevision: collections[0].revision
  };
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

// Must match normalizeRequestedAiImageCollections in the API: the picked
// collections' keys in order, joined with commas (one collection keeps the
// 11-15 key); `collections` wins over the single legacy fields.
export function buildAIImageCollectionsKey({
  collections,
  collectionId,
  collectionRevision
}: {
  collections?: { id: number; revision: number }[];
  collectionId?: number | null;
  collectionRevision?: number | null;
}) {
  const list = Array.isArray(collections)
    ? collections
    : collectionId != null
      ? [{ id: collectionId, revision: collectionRevision ?? 0 }]
      : [];
  const seen: number[] = [];
  const keys: string[] = [];
  for (const item of list) {
    const key = buildAIImageCollectionKey({
      collectionId: item?.id,
      collectionRevision: item?.revision
    });
    const id = Number(item?.id);
    if (!key || seen.includes(id)) continue;
    seen.push(id);
    keys.push(key);
  }
  return keys.join(',');
}
