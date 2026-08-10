import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
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

test('Featured consumers apply confirmed responses and wait for Explore loads', () => {
  const socketSource = source(
    '../src/containers/App/Header/hooks/useAPISocket/useInitSocket.ts'
  );
  const homeSource = source(
    '../src/containers/Home/Stories/Featured/Subjects.tsx'
  );
  const exploreSource = source('../src/containers/Explore/Subjects/index.tsx');
  const selectSource = source(
    '../src/containers/Explore/Modals/SelectFeaturedSubjects.tsx'
  );

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
  assert.match(
    selectSource,
    /const subjects = await uploadFeaturedSubjects[\s\S]*onSubmit\(subjects\)/
  );
});
