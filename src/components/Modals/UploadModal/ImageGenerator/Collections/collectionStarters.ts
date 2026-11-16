import {
  AI_IMAGE_COLLECTIONS_COMBINE_MAX,
  AI_IMAGE_COLLECTION_REFERENCES_MAX,
  type AIImageCollection,
  type AIImageCollectionRole
} from '~/helpers/aiImageHistory';

// The first screen's examples (Mikey 11-16: "not just limited to one use
// case"). A tap fills in a name and the job new pictures start with; the
// member can change both.
export interface CollectionStarter {
  key: string;
  label: string;
  icon: string;
  name: string;
  role: AIImageCollectionRole;
}

export const COLLECTION_STARTERS: CollectionStarter[] = [
  {
    key: 'characters',
    label: 'Characters',
    icon: 'users',
    name: 'My characters',
    role: 'character'
  },
  {
    key: 'style',
    label: 'An art style',
    icon: 'palette',
    name: 'My art style',
    role: 'style'
  },
  {
    key: 'place',
    label: 'A place or world',
    icon: 'globe',
    name: 'My world',
    role: 'place'
  },
  {
    key: 'logo',
    label: 'A logo or brand',
    icon: 'tag',
    name: 'My logo',
    role: 'object'
  },
  {
    key: 'game',
    label: 'Game assets',
    icon: 'cubes',
    name: "My game's art",
    role: 'style'
  },
  { key: 'pet', label: 'A pet', icon: 'heart', name: 'My pet', role: 'character' },
  {
    key: 'mood',
    label: 'A mood board',
    icon: 'images',
    name: 'My mood board',
    role: 'other'
  }
];

export function collectionPictureTotal(collections: AIImageCollection[]) {
  return collections.reduce(
    (sum, collection) => sum + collection.images.length,
    0
  );
}

// Whether a collection can join the ones in use for the same picture. The
// server checks the same limits; the website only offers what fits.
export function canAddCollection(
  active: AIImageCollection[],
  collection: AIImageCollection
) {
  return (
    active.length > 0 &&
    active.length < AI_IMAGE_COLLECTIONS_COMBINE_MAX &&
    !active.some((item) => item.id === collection.id) &&
    collectionPictureTotal(active) + collection.images.length <=
      AI_IMAGE_COLLECTION_REFERENCES_MAX
  );
}

// "2 characters · 1 art style": what a collection teaches, at a glance.
export function describeCollectionRoles(collection: AIImageCollection) {
  const counts = new Map<AIImageCollectionRole, number>();
  for (const image of collection.images) {
    counts.set(image.role, (counts.get(image.role) || 0) + 1);
  }
  const words: Record<AIImageCollectionRole, [string, string]> = {
    character: ['character', 'characters'],
    style: ['art style', 'art styles'],
    place: ['place', 'places'],
    object: ['thing', 'things'],
    other: ['other picture', 'other pictures']
  };
  return Array.from(counts.entries())
    .map(([role, count]) => `${count} ${words[role][count === 1 ? 0 : 1]}`)
    .join(' · ');
}
