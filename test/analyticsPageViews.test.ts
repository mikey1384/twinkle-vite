import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAnalyticsPageViewController,
  getAnalyticsPath
} from '../src/helpers/analyticsPageViews';

test('analytics route identity ignores React Router key and state changes', () => {
  const firstLocation = {
    pathname: '/app/884',
    search: '?embedded=1',
    hash: '#chapter-2',
    key: 'first',
    state: { launchTarget: 'chapter-2' }
  };
  const stateOnlyReplacement = {
    ...firstLocation,
    key: 'second',
    state: null
  };

  assert.equal(
    getAnalyticsPath(firstLocation),
    getAnalyticsPath(stateOnlyReplacement)
  );
});

test('page views preserve each visited URL and its virtual referrer', () => {
  const trackedPageViews: Array<{
    path: string;
    referrerPath: string | null;
  }> = [];
  const controller = createAnalyticsPageViewController((pageView) =>
    trackedPageViews.push(pageView)
  );

  controller.observe({ path: '/app/884' });
  controller.observe({ path: '/app/885?source=feed' });

  assert.deepEqual(trackedPageViews, [
    { path: '/app/884', referrerPath: null },
    { path: '/app/885?source=feed', referrerPath: '/app/884' }
  ]);
});

test('state-only observations do not duplicate a tracked page view', () => {
  const trackedPageViews: Array<{
    path: string;
    referrerPath: string | null;
  }> = [];
  const controller = createAnalyticsPageViewController((pageView) =>
    trackedPageViews.push(pageView)
  );

  controller.observe({ path: '/build' });
  controller.observe({ path: '/build' });
  controller.observe({ path: '/build/884' });
  controller.observe({ path: '/build' });

  assert.deepEqual(trackedPageViews, [
    { path: '/build', referrerPath: null },
    { path: '/build/884', referrerPath: '/build' },
    { path: '/build', referrerPath: '/build/884' }
  ]);
});
