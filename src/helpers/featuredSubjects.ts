let featuredSubjectsGeneration = 0;
let nextFeaturedSubjectsRequestId = 0;
let latestAppliedFeaturedSubjectsRequestId = 0;

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
