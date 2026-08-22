let featuredSubjectsGeneration = 0;
let nextFeaturedSubjectsRequestId = 0;
let latestAppliedFeaturedSubjectsRequestId = 0;

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
