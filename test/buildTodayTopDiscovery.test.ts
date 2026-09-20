import assert from 'node:assert/strict';
import test from 'node:test';
import BuildReducer, {
  createInitialBuildStudioState,
  type BuildState
} from '../src/contexts/Build/reducer';
import {
  getBuildDiscoveryRefreshDelay,
  isBuildDiscoveryCacheCurrent
} from '../src/containers/Build/List/helpers/discovery';
import { normalizeBuildRuntimeViewSource } from '../src/containers/Build/constants/runtimeViewSources';

test('both discovery links retain attribution when the runtime opens', () => {
  for (const source of ['build_trending_showcase', 'build_today_top']) {
    assert.equal(normalizeBuildRuntimeViewSource(source), source);
  }
  assert.equal(normalizeBuildRuntimeViewSource(null), '');
  assert.equal(normalizeBuildRuntimeViewSource('arbitrary'), '');
});

function loadedState() {
  return BuildReducer(
    { buildStudio: createInitialBuildStudioState() } as BuildState,
    {
      type: 'SET_BUILD_STUDIO_TODAY_TOP_VIEWED_BUILD',
      buildStudio: {
        userId: 7,
        build: { id: 4, title: 'Rotating discovery pick' },
        builds: [
          { id: 9, todayViewCount: 20 },
          { id: 4, todayViewCount: 12 }
        ],
        nextDay: Date.parse('2026-09-21T00:00:00Z')
      }
    }
  );
}

test('daily rankings and the independently chosen trending app survive cache hydration', () => {
  const state = loadedState();
  const cache = state.buildStudio.quickAccess.todayTopViewed;
  assert.equal(cache.build.id, 4);
  assert.deepEqual(
    cache.builds.map((build) => build.id),
    [9, 4]
  );
  assert.equal(cache.builds[1].todayViewCount, 12);
  assert.equal(state.buildsById[9].id, 9);
  assert.equal(cache.userId, 7);
});

test('server-confirmed removal clears a ranked app and the spotlight without clearing other users caches', () => {
  let state = loadedState();
  const remove = (userId: number) => ({
    type: 'REMOVE_BUILD_STUDIO_QUICK_ACCESS_BUILDS' as const,
    buildStudio: { userId, buildIds: [4] }
  });
  state = BuildReducer(state, remove(8));
  assert.equal(state.buildStudio.quickAccess.todayTopViewed.builds.length, 2);
  state = BuildReducer(state, remove(7));
  const cache = state.buildStudio.quickAccess.todayTopViewed;
  assert.equal(cache.build, null);
  assert.deepEqual(
    cache.builds.map((build) => build.id),
    [9]
  );
});

test('an empty new-day response replaces yesterday instead of leaving old ranked apps', () => {
  const state = BuildReducer(loadedState(), {
    type: 'SET_BUILD_STUDIO_TODAY_TOP_VIEWED_BUILD',
    buildStudio: {
      userId: 7,
      build: null,
      builds: [],
      nextDay: Date.parse('2026-09-22T00:00:00Z')
    }
  });
  assert.deepEqual(state.buildStudio.quickAccess.todayTopViewed.builds, []);
  assert.equal(state.buildStudio.quickAccess.todayTopViewed.build, null);
});

test('expired or another user’s cached discovery is hidden while fresh results load', () => {
  const cache = loadedState().buildStudio.quickAccess.todayTopViewed;
  const midnight = Number(cache.nextDay);
  assert.equal(isBuildDiscoveryCacheCurrent(cache, 7, midnight - 1), true);
  assert.equal(isBuildDiscoveryCacheCurrent(cache, 7, midnight), false);
  assert.equal(isBuildDiscoveryCacheCurrent(cache, 8, midnight - 1), false);
  assert.equal(isBuildDiscoveryCacheCurrent(cache, null, midnight - 1), false);
});

test('refresh reaches the daily reset and old or malformed responses cannot cause a tight request loop', () => {
  const now = Date.parse('2026-09-20T23:59:55Z');
  assert.equal(getBuildDiscoveryRefreshDelay(now + 5000, now), 5000);
  assert.equal(getBuildDiscoveryRefreshDelay(now + 86400000, now), 1800000);
  assert.equal(getBuildDiscoveryRefreshDelay(now - 5000, now), 30000);
  for (const reset of [undefined, null, 0, 'invalid', Infinity]) {
    assert.equal(getBuildDiscoveryRefreshDelay(reset, now), 1800000);
  }
});
