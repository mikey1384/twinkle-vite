import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  FEATURED_SUBJECTS_REFRESH_JITTER_DEFAULT_MS,
  getFeaturedSubjectIds,
  getFeaturedSubjectsRefreshDelayMs,
  invalidateFeaturedSubjectsRequests,
  loadLatestCanonicalFeaturedSubjects,
  resetFeaturedSubjectsRequestsForTests
} from '../src/helpers/featuredSubjects';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function source(relativePath: string) {
  return readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), relativePath),
    'utf8'
  );
}

test('a slower Featured response cannot replace a newer canonical response', async () => {
  resetFeaturedSubjectsRequestsForTests();
  const first = deferred<object[]>();
  const second = deferred<object[]>();
  const firstLoad = loadLatestCanonicalFeaturedSubjects({
    load: () => first.promise
  });
  const secondLoad = loadLatestCanonicalFeaturedSubjects({
    load: () => second.promise
  });

  second.resolve([{ id: 2 }]);
  assert.deepEqual(await secondLoad, [{ id: 2 }]);
  first.resolve([{ id: 1 }]);
  assert.equal(await firstLoad, null);
});

test('a mutation invalidation rejects every pre-mutation Featured snapshot', async () => {
  resetFeaturedSubjectsRequestsForTests();
  const stale = deferred<object[]>();
  const fresh = deferred<object[]>();
  const staleLoad = loadLatestCanonicalFeaturedSubjects({
    load: () => stale.promise
  });

  invalidateFeaturedSubjectsRequests();
  const freshLoad = loadLatestCanonicalFeaturedSubjects({
    load: () => fresh.promise
  });
  stale.resolve([{ id: 1 }]);
  assert.equal(await staleLoad, null);
  fresh.resolve([{ id: 2 }]);
  assert.deepEqual(await freshLoad, [{ id: 2 }]);
});

test('a failed overlapping request does not discard an older confirmed response', async () => {
  resetFeaturedSubjectsRequestsForTests();
  const first = deferred<object[]>();
  const second = deferred<object[]>();
  const firstLoad = loadLatestCanonicalFeaturedSubjects({
    load: () => first.promise
  });
  const secondLoad = loadLatestCanonicalFeaturedSubjects({
    load: () => second.promise
  });

  second.reject(new Error('temporary failure'));
  await assert.rejects(secondLoad, /temporary failure/);
  first.resolve([{ id: 1 }]);
  assert.deepEqual(await firstLoad, [{ id: 1 }]);
});

test('featured selection initializes from valid canonical subject ids', () => {
  assert.deepEqual(
    getFeaturedSubjectIds([
      { id: 3 },
      { id: '2' },
      { id: 3 },
      { id: 4.5 },
      { id: 0 },
      null
    ]),
    [3, 2]
  );
  assert.deepEqual(getFeaturedSubjectIds(null), []);
});

test('Featured consumers apply confirmed responses and wait for Explore loads', () => {
  const socketSource = source(
    '../src/containers/App/Header/hooks/useAPISocket/useInitSocket.ts'
  );
  const homeSource = source(
    '../src/containers/Home/Stories/Featured/Subjects.tsx'
  );
  const exploreSource = source('../src/containers/Explore/Subjects/index.tsx');
  const exploreStateSource = source('../src/contexts/Explore/index.tsx');
  const exploreFeaturedSource = source(
    '../src/containers/Explore/Subjects/Featured.tsx'
  );
  const selectSource = source(
    '../src/containers/Explore/Modals/SelectFeaturedSubjects.tsx'
  );
  const profileFeaturedSource = source(
    '../src/containers/Profile/Body/Home/Activities/FeaturedSubjects/index.tsx'
  );
  const profileSelectSource = source(
    '../src/containers/Profile/Body/Home/Activities/FeaturedSubjects/SelectFeaturedSubjects.tsx'
  );
  const profileHomeSource = source('../src/containers/Profile/Body/Home/index.tsx');

  assert.match(
    socketSource,
    /featuredSubjects === true[\s\S]*invalidateFeaturedSubjectsRequests\(\)[\s\S]*refreshFeaturedSubjects\(\);[\s\S]*return;/
  );
  assert.match(socketSource, /refreshFeaturedSubjects[\s\S]*loadLatestCanonicalFeaturedSubjects/);
  assert.match(homeSource, /loadLatestCanonicalFeaturedSubjects/);
  assert.doesNotMatch(homeSource, /onLoadFeaturedSubjects\(\[\]\)/);
  assert.match(
    exploreSource,
    /await Promise\.allSettled\([\s\S]*onSetSubjectsLoaded\(true\)/
  );
  assert.match(exploreSource, /loadLatestCanonicalFeaturedSubjects/);
  assert.match(exploreStateSource, /featuredLoaded: false/);
  assert.equal(
    Array.from(exploreFeaturedSource.matchAll(/disabled=\{!loaded\}/g)).length,
    2
  );
  assert.match(selectSource, /getFeaturedSubjectIds\(subjects\)/);
  assert.match(
    selectSource,
    /const searchGeneration = searchGenerationRef\.current;[\s\S]*if \(searchGeneration !== searchGenerationRef\.current\) return;/
  );
  assert.match(
    selectSource,
    /const loadGeneration = searchGenerationRef\.current;[\s\S]*if \(loadGeneration !== searchGenerationRef\.current\) return;/
  );
  assert.match(
    selectSource,
    /disabled=\{!loaded \|\| selected\.length > MAX_SUBJECTS\}/
  );
  assert.match(
    selectSource,
    /const subjects = await uploadFeaturedSubjects[\s\S]*onSubmit\(subjects\)/
  );
  assert.equal(
    Array.from(profileFeaturedSource.matchAll(/disabled=\{!loaded\}/g)).length,
    2
  );
  assert.match(profileSelectSource, /getFeaturedSubjectIds\(subjects\)/);
  assert.match(
    profileSelectSource,
    /const searchGeneration = searchGenerationRef\.current;[\s\S]*if \(searchGeneration !== searchGenerationRef\.current\) return;/
  );
  assert.match(
    profileSelectSource,
    /const loadGeneration = searchGenerationRef\.current;[\s\S]*if \(loadGeneration !== searchGenerationRef\.current\) return;/
  );
  assert.match(
    profileSelectSource,
    /disabled=\{!loaded \|\| selected\.length > 10\}/
  );
  assert.match(
    profileSelectSource,
    /const subjects = await featureSubjectsOnProfile[\s\S]*onSubmit\(subjects\)/
  );
  assert.doesNotMatch(profileSelectSource, /onSubmit\(selected\.map/);
  for (const reorderSource of [
    source(
      '../src/containers/Profile/Body/Home/Activities/FeaturedSubjects/ReorderFeaturedSubjects.tsx'
    ),
    source('../src/containers/Explore/Modals/ReorderFeaturedSubjects.tsx')
  ]) {
    assert.match(reorderSource, /finally \{[\s\S]*setIsReordering\(false\)/);
  }
  assert.match(profileHomeSource, /loaded=\{isSubjectsLoaded\}/);
  assert.doesNotMatch(profileHomeSource, /isSubjectsLoading/);
});

test('a Featured invalidation refetch is spread across the jitter window', () => {
  // Default window when the server sends no hint (older server).
  assert.equal(getFeaturedSubjectsRefreshDelayMs(undefined, 0), 0);
  assert.equal(
    getFeaturedSubjectsRefreshDelayMs(undefined, 0.5),
    FEATURED_SUBJECTS_REFRESH_JITTER_DEFAULT_MS / 2
  );
  assert.equal(
    getFeaturedSubjectsRefreshDelayMs(undefined, 1),
    FEATURED_SUBJECTS_REFRESH_JITTER_DEFAULT_MS
  );
  // A server hint sets the window; an explicit 0 means refetch now.
  assert.equal(getFeaturedSubjectsRefreshDelayMs(20_000, 0.25), 5_000);
  assert.equal(getFeaturedSubjectsRefreshDelayMs(0, 0.9), 0);
  // Malformed hints fall back to the default; absurd hints are capped.
  assert.equal(
    getFeaturedSubjectsRefreshDelayMs('8000', 1),
    FEATURED_SUBJECTS_REFRESH_JITTER_DEFAULT_MS
  );
  assert.equal(
    getFeaturedSubjectsRefreshDelayMs(-1, 1),
    FEATURED_SUBJECTS_REFRESH_JITTER_DEFAULT_MS
  );
  assert.equal(
    getFeaturedSubjectsRefreshDelayMs(Number.NaN, 1),
    FEATURED_SUBJECTS_REFRESH_JITTER_DEFAULT_MS
  );
  assert.equal(getFeaturedSubjectsRefreshDelayMs(10 * 60_000, 1), 60_000);
  // A broken random source never produces a negative or NaN delay.
  assert.equal(getFeaturedSubjectsRefreshDelayMs(undefined, Number.NaN), 0);
  assert.equal(getFeaturedSubjectsRefreshDelayMs(undefined, 7), 8_000);
  for (let i = 0; i < 50; i += 1) {
    const delay = getFeaturedSubjectsRefreshDelayMs();
    assert.ok(
      delay >= 0 && delay <= FEATURED_SUBJECTS_REFRESH_JITTER_DEFAULT_MS
    );
  }
});

test('the socket handler invalidates immediately, defers the refetch, and coalesces pending refreshes', () => {
  const handler = source(
    '../src/containers/App/Header/hooks/useAPISocket/useInitSocket.ts'
  );
  const handleHomeOutdated = handler.slice(
    handler.indexOf('function handleHomeOutdated('),
    handler.indexOf('async function refreshFeaturedSubjects(')
  );
  assert.match(handleHomeOutdated, /refreshJitterMs/);
  // Invalidation is synchronous so no pre-mutation snapshot can land while
  // the deferred refetch waits.
  assert.match(
    handleHomeOutdated,
    /invalidateFeaturedSubjectsRequests\(\);\s*if \(featuredSubjectsRefreshTimerRef\.current\) return;/
  );
  assert.match(
    handleHomeOutdated,
    /window\.setTimeout\([\s\S]*?void refreshFeaturedSubjects\(\);[\s\S]*?getFeaturedSubjectsRefreshDelayMs\(refreshJitterMs\)/
  );
  assert.doesNotMatch(
    handleHomeOutdated,
    /invalidateFeaturedSubjectsRequests\(\);\s*void refreshFeaturedSubjects\(\);/
  );
  // The generic (feed) branch is untouched by the Featured jitter.
  assert.match(handleHomeOutdated, /onSetFeedsOutdated\(true\)/);
  assert.doesNotMatch(
    handleHomeOutdated.slice(handleHomeOutdated.indexOf('onSetFeedsOutdated')),
    /getFeaturedSubjectsRefreshDelayMs/
  );
  // The mount-lifetime socket effect clears the pending timer on unmount.
  assert.match(
    handler,
    /return function cleanUp\(\) \{[\s\S]*?clearTimeout\(featuredSubjectsRefreshTimerRef\.current\)/
  );
});
