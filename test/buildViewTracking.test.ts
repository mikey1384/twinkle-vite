import test from 'node:test';
import assert from 'node:assert/strict';
import { getActiveBuildViewEvent } from '../src/containers/Build/Runtime/helpers/buildViewTracking';
import { createBuildViewOnceController } from '../src/helpers/buildViewAnalytics';

const buildView = {
  buildId: 884,
  buildTitle: 'Twinkle Book Maker',
  ownerUsername: 'mikey'
};

function createSession(overrides: Record<string, unknown> = {}) {
  return {
    buildId: 884,
    buildView,
    buildViewTracked: false,
    loaded: true,
    ...overrides
  };
}

test('emits a canonical build view only for the visible loaded session', () => {
  assert.deepEqual(
    getActiveBuildViewEvent({
      activeBuildId: 884,
      isRuntimeRoute: true,
      session: createSession()
    }),
    buildView
  );
});

test('does not count a build that finishes loading in a background session', () => {
  assert.equal(
    getActiveBuildViewEvent({
      activeBuildId: 885,
      isRuntimeRoute: true,
      session: createSession()
    }),
    null
  );
});

test('does not recount a tracked build or count noncanonical load identity', () => {
  assert.equal(
    getActiveBuildViewEvent({
      activeBuildId: 884,
      isRuntimeRoute: true,
      session: createSession({ buildViewTracked: true })
    }),
    null
  );
  assert.equal(
    getActiveBuildViewEvent({
      activeBuildId: 884,
      isRuntimeRoute: true,
      session: createSession({
        buildView: { ...buildView, buildId: 999 }
      })
    }),
    null
  );
});

test('counts an embedded build load once per canonical frame URL', () => {
  const trackedViews: (typeof buildView)[] = [];
  const controller = createBuildViewOnceController((view) =>
    trackedViews.push(view)
  );

  assert.equal(controller.track('/app/884?embedded=1&rev=1', buildView), true);
  assert.equal(controller.track('/app/884?embedded=1&rev=1', buildView), false);
  assert.equal(controller.track('/app/884?embedded=1&rev=2', buildView), true);
  assert.deepEqual(trackedViews, [buildView, buildView]);
});
