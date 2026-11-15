import { useSyncExternalStore } from 'react';

// Profile "Featured": the member's subjects and own comments, in their order.
// The server owns the list (twinkle-api helpers/user/profileFeatured.ts);
// this file only remembers the signed-in member's last canonical copy so a
// comment's ⌄ menu can say "Feature on my profile" or "Remove from profile".

export type ProfileFeaturedType = 'subject' | 'comment';
export interface ProfileFeaturedRef {
  contentType: ProfileFeaturedType;
  contentId: number;
}

export const MAX_PROFILE_FEATURED_ITEMS = 10;

export function profileFeaturedItemKey(item: {
  contentType?: string;
  id?: number;
  contentId?: number;
}) {
  return `${item?.contentType === 'comment' ? 'comment' : 'subject'}:${
    Number(item?.contentId ?? item?.id) || 0
  }`;
}

export function profileFeaturedRefsFromItems(items: any[]): ProfileFeaturedRef[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      contentType: (item?.contentType === 'comment'
        ? 'comment'
        : 'subject') as ProfileFeaturedType,
      contentId: Number(item?.id) || 0
    }))
    .filter((ref) => ref.contentId > 0);
}

interface MyFeaturedState {
  userId: number;
  refs: ProfileFeaturedRef[];
  loaded: boolean;
}

const EMPTY_STATE: MyFeaturedState = { userId: 0, refs: [], loaded: false };
let state: MyFeaturedState = EMPTY_STATE;
let generation = 0;
let inflight: { userId: number; promise: Promise<void> } | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

export { getSnapshot as getMyProfileFeaturedSnapshot };

function sanitizeRefs(refs: unknown): ProfileFeaturedRef[] {
  if (!Array.isArray(refs)) return [];
  return refs
    .filter(
      (ref) =>
        (ref?.contentType === 'subject' || ref?.contentType === 'comment') &&
        Number(ref?.contentId) > 0
    )
    .map((ref) => ({
      contentType: ref.contentType,
      contentId: Number(ref.contentId)
    }));
}

// Apply a canonical list the server just returned (any featured write).
export function applyMyProfileFeaturedRefs(userId: number, refs: unknown) {
  if (!userId) return;
  generation += 1;
  state = { userId, refs: sanitizeRefs(refs), loaded: true };
  emit();
}

// Load once per signed-in member; a write that lands meanwhile wins.
export function ensureMyProfileFeaturedRefs({
  userId,
  load
}: {
  userId: number;
  load: () => Promise<{ refs?: unknown }>;
}) {
  if (!userId) return;
  if (state.userId === userId && state.loaded) return;
  if (inflight?.userId === userId) return;
  const startedGeneration = generation;
  const entry: { userId: number; promise: Promise<void> } = {
    userId,
    promise: Promise.resolve()
  };
  entry.promise = (async () => {
    try {
      const data = await load();
      if (startedGeneration !== generation) return;
      applyMyProfileFeaturedRefs(userId, data?.refs);
    } catch (error) {
      console.error('Failed to load featured profile items:', error);
    } finally {
      if (inflight === entry) inflight = null;
    }
  })();
  inflight = entry;
}

export function useMyProfileFeaturedRefs(userId: number): MyFeaturedState {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return snapshot.userId === userId ? snapshot : EMPTY_STATE;
}
