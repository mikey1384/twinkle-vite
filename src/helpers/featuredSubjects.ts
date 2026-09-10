let featuredSubjectsGeneration = 0;
let nextFeaturedSubjectsRequestId = 0;
let latestAppliedFeaturedSubjectsRequestId = 0;

// A Featured board change is broadcast to every connected client at once. If
// each client refetched immediately, the writer-consistent board read would
// stampede the API's writer pool. Spread the refetch over a jitter window
// instead; the server may hint a window per event, and an absent or malformed
// hint falls back to this default so older servers still fan out safely.
export const FEATURED_SUBJECTS_REFRESH_JITTER_DEFAULT_MS = 8_000;
const FEATURED_SUBJECTS_REFRESH_JITTER_MAX_MS = 60_000;

export function getFeaturedSubjectsRefreshDelayMs(
  refreshJitterMs?: unknown,
  randomValue = Math.random()
) {
  const hintedWindowMs =
    typeof refreshJitterMs === 'number' &&
    Number.isFinite(refreshJitterMs) &&
    refreshJitterMs >= 0
      ? Math.min(refreshJitterMs, FEATURED_SUBJECTS_REFRESH_JITTER_MAX_MS)
      : FEATURED_SUBJECTS_REFRESH_JITTER_DEFAULT_MS;
  const boundedRandomValue = Number.isFinite(randomValue)
    ? Math.min(Math.max(randomValue, 0), 1)
    : 0;
  return Math.floor(boundedRandomValue * hintedWindowMs);
}

export function getFeaturedSubjectIds(subjects: unknown): number[] {
  if (!Array.isArray(subjects)) return [];
  const seen = new Set<number>();
  const ids: number[] = [];
  for (const subject of subjects) {
    const id = Number(subject?.id || 0);
    if (!Number.isSafeInteger(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

// A confirmed mutation makes every request that started before it obsolete,
// even if the replacement request later fails. Preserve the last confirmed UI
// instead of allowing an older snapshot to land after the mutation signal.
export function invalidateFeaturedSubjectsRequests() {
  featuredSubjectsGeneration += 1;
  latestAppliedFeaturedSubjectsRequestId = 0;
}

export async function loadLatestCanonicalFeaturedSubjects({
  load,
  isCurrentOwner = () => true
}: {
  load: () => Promise<object[]>;
  isCurrentOwner?: () => boolean;
}): Promise<object[] | null> {
  const generation = featuredSubjectsGeneration;
  const requestId = ++nextFeaturedSubjectsRequestId;
  const subjects = await load();

  if (!isCurrentOwner()) return null;
  if (generation !== featuredSubjectsGeneration) return null;
  // Concurrent reads in one generation may both be valid. Apply responses in
  // server-confirmed arrival order, but never let the slower one replace a
  // newer response that has already landed.
  if (requestId < latestAppliedFeaturedSubjectsRequestId) return null;
  if (!Array.isArray(subjects)) {
    throw new Error('Featured Subjects response must be an array.');
  }

  latestAppliedFeaturedSubjectsRequestId = requestId;
  return subjects;
}

/** @internal exported for focused tests */
export function resetFeaturedSubjectsRequestsForTests() {
  featuredSubjectsGeneration = 0;
  nextFeaturedSubjectsRequestId = 0;
  latestAppliedFeaturedSubjectsRequestId = 0;
}
