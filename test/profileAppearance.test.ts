import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PROFILE_APPEARANCE_MAX_AGE_MS,
  isProfileAppearanceFresh,
  reconcileProfileAppearancePatch,
  resolveProfileAppearance,
  withLoadedProfileAppearance
} from '../src/helpers/profileAppearance';

const oldAppearance = {
  profileTheme: 'platinum',
  profileCoverUrl: '/old.jpg',
  profileCoverPosition: '20,80',
  profileCoverShine: 1
};

test('a canonical cover replacement, clear, theme and settings override old caller data', () => {
  const current = {
    profileTheme: 'gold',
    profileCoverUrl: null,
    profileCoverPosition: null,
    profileCoverShine: 0
  };
  assert.deepEqual(resolveProfileAppearance(oldAppearance, current), current);
  assert.deepEqual(resolveProfileAppearance(oldAppearance, {}), oldAppearance);
  assert.equal(
    resolveProfileAppearance(oldAppearance, { profileCoverUrl: '/new.jpg' })
      .profileCoverUrl,
    '/new.jpg'
  );
});

test('full legacy profiles normalize absent cover fields once; known no-photo profiles stay cacheable', () => {
  const loaded = withLoadedProfileAppearance({ id: 2, profileTheme: 'gold' }, 100, 200);
  assert.equal(loaded.profileCoverUrl, null);
  assert.equal(loaded.profileCoverPosition, null);
  assert.equal(loaded.profileCoverShine, true);
  assert.equal(isProfileAppearanceFresh(loaded.profileAppearanceLoadedAt, 201), true);
  assert.equal(isProfileAppearanceFresh(200, 200 + PROFILE_APPEARANCE_MAX_AGE_MS), false);
  assert.equal(isProfileAppearanceFresh(undefined as any, 201), false);
  assert.equal(isProfileAppearanceFresh(300, 201), false);
  const defaultTheme = withLoadedProfileAppearance({ id: 2, profileTheme: null }, 100, 200);
  assert.equal(defaultTheme.profileTheme, 'logoBlue');
  assert.equal(isProfileAppearanceFresh(defaultTheme.profileAppearanceLoadedAt, 201), true);
  assert.deepEqual(withLoadedProfileAppearance({ userNotExist: true }, 100, 200), { userNotExist: true });
});

test('a slow read cannot undo a saved removal, but a newer complete read can restore a new cover', () => {
  const initial = withLoadedProfileAppearance({ id: 2, ...oldAppearance }, 100, 110);
  const removed = {
    ...initial,
    ...reconcileProfileAppearancePatch(initial, {
      profileCoverUrl: null,
      profileCoverPosition: null
    }, 200)
  };
  const stale = withLoadedProfileAppearance({ id: 2, ...oldAppearance, rank: 4 }, 150, 300);
  const afterStale = { ...removed, ...reconcileProfileAppearancePatch(removed, stale, 300) };
  assert.equal(afterStale.profileCoverUrl, null);
  assert.equal(afterStale.profileCoverPosition, null);
  assert.equal(afterStale.rank, 4, 'unrelated fresh data can still update');
  assert.equal(afterStale.profileAppearanceLoadedAt, 110, 'discarded appearance reads do not extend freshness');
  const newer = withLoadedProfileAppearance({ id: 2, ...oldAppearance, profileCoverUrl: '/new.jpg' }, 400, 450);
  assert.equal(reconcileProfileAppearancePatch(afterStale, newer)?.profileCoverUrl, '/new.jpg');
});

test('out-of-order and coalesced profile replies retain the age of the actual read', () => {
  const payload = { id: 2, ...oldAppearance };
  const firstConsumer = withLoadedProfileAppearance(payload, 100, 300);
  const laterConsumer = withLoadedProfileAppearance(payload, 250, 301);
  assert.equal(laterConsumer.profileAppearanceRequestStartedAt, 100);
  assert.equal(laterConsumer.profileAppearanceLoadedAt, 300);
  const changed = { profileCoverUrl: null, profileAppearanceChangedAt: 200 };
  for (const response of [firstConsumer, laterConsumer]) {
    assert.equal(Object.hasOwn(reconcileProfileAppearancePatch(changed, response)!, 'profileCoverUrl'), false);
  }
  const newer = withLoadedProfileAppearance({ id: 2, ...oldAppearance, profileCoverUrl: '/new.jpg' }, 400, 450);
  assert.equal(Object.hasOwn(reconcileProfileAppearancePatch(newer, firstConsumer)!, 'profileCoverUrl'), false);
});
