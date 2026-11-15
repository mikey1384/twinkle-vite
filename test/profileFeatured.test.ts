import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyMyProfileFeaturedRefs,
  ensureMyProfileFeaturedRefs,
  getMyProfileFeaturedSnapshot,
  profileFeaturedItemKey,
  profileFeaturedRefsFromItems
} from '../src/helpers/profileFeatured';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

test('a subject and a comment with the same id never share a key', () => {
  assert.equal(profileFeaturedItemKey({ contentType: 'subject', id: 5 }), 'subject:5');
  assert.equal(profileFeaturedItemKey({ contentType: 'comment', id: 5 }), 'comment:5');
  assert.deepEqual(
    profileFeaturedRefsFromItems([
      { contentType: 'comment', id: 5 },
      { contentType: 'subject', id: 5 },
      { contentType: 'subject' }
    ]),
    [
      { contentType: 'comment', contentId: 5 },
      { contentType: 'subject', contentId: 5 }
    ]
  );
});

test('a write that lands while the first load is in flight wins', async () => {
  const load = deferred<{ refs: unknown }>();
  let calls = 0;
  const loader = () => {
    calls += 1;
    return load.promise;
  };
  ensureMyProfileFeaturedRefs({ userId: 41, load: loader });
  // a second menu mounting meanwhile does not start another request
  ensureMyProfileFeaturedRefs({ userId: 41, load: loader });
  assert.equal(calls, 1);
  applyMyProfileFeaturedRefs(41, [{ contentType: 'comment', contentId: 9 }]);
  load.resolve({ refs: [] });
  await load.promise;
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(getMyProfileFeaturedSnapshot(), {
    userId: 41,
    refs: [{ contentType: 'comment', contentId: 9 }],
    loaded: true
  });
  // loaded now: no further request for the same member
  ensureMyProfileFeaturedRefs({ userId: 41, load: loader });
  assert.equal(calls, 1);
  // another account starts its own load
  ensureMyProfileFeaturedRefs({
    userId: 42,
    load: async () => ({ refs: [] })
  });
});
