import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('home load-more has one scheduler-owned timeout and retry budget', () => {
  const storiesSource = readSource('src/containers/Home/Stories/index.tsx');
  const requestSource = readSource('src/contexts/requestHelpers/content.ts');
  const schedulerSource = readSource(
    'src/contexts/requestHelpers/axiosInstance/requestScheduler.ts'
  );

  assert.doesNotMatch(
    storiesSource,
    /HOME_FEED_LOAD_MORE_WATCHDOG|loadMoreWatchdog/
  );
  assert.match(
    requestSource,
    /meta: \{[\s\S]*?collapseKey: null,[\s\S]*?maxRetries: 1,[\s\S]*?totalTimeoutMs: HOME_FEED_LOAD_MORE_TOTAL_TIMEOUT_MS/
  );
  assert.match(
    requestSource,
    /HOME_FEED_LOAD_MORE_TOTAL_TIMEOUT_MS = 60000/
  );
  assert.match(
    schedulerSource,
    /executeWithinTotalTimeout[\s\S]*?Promise\.race\([\s\S]*?executeWithRetries/
  );
  assert.match(
    schedulerSource,
    /await sleep\(delayMs, baseConfig\.signal\)/
  );
  assert.match(
    schedulerSource,
    /raceWithRequestAbort\([\s\S]*?this\.limiters\.run\(\{[\s\S]*?priority: config\.meta\?\.priority,[\s\S]*?task: async \(\) => \{\s*throwIfRequestAborted\(baseConfig\.signal\)/
  );
  assert.match(schedulerSource, /Promise\.race\(\[promise, abortPromise\]\)/);
  assert.match(
    schedulerSource,
    /shouldRetry\([\s\S]*?isTimeoutAbortSignal\(controller\.signal\)/
  );
  assert.match(
    schedulerSource,
    /if \(attemptTimedOut\) return true/
  );
});

test('home pagination advances from confirmed response cursors before render dedupe', () => {
  const storiesSource = readSource('src/containers/Home/Stories/index.tsx');
  const actionSource = readSource('src/contexts/Home/actions.ts');
  const contextSource = readSource('src/contexts/Home/index.tsx');
  const reducerSource = readSource('src/contexts/Home/reducer.ts');

  assert.match(
    storiesSource,
    /Object\.prototype\.hasOwnProperty\.call\(page, 'nextCursor'\)/
  );
  assert.match(
    storiesSource,
    /const canonicalPage = getCanonicalHomeFeedPage\(data\);[\s\S]*?page: canonicalPage[\s\S]*?onLoadMoreFeeds\(\{ \.\.\.canonicalPage, feedPaginationCursor: nextCursor \}\)/
  );
  assert.match(
    storiesSource,
    /visibleNewFeedCount === 0[\s\S]*?Skipped posts already shown — Continue[\s\S]*?Skipped unavailable posts — Continue/
  );
  assert.match(
    reducerSource,
    /case 'LOAD_MORE_FEEDS':[\s\S]*?appendUniqueHomeFeeds\(state\.feeds, action\.feeds\)/
  );
  assert.match(contextSource, /feedPaginationCursor: null/);
  assert.match(
    actionSource,
    /type: 'LOAD_MORE_FEEDS',[\s\S]*?feedPaginationCursor/
  );
  assert.match(
    reducerSource,
    /case 'LOAD_FEEDS':[\s\S]*?feedPaginationCursor: action\.loadMoreButton[\s\S]*?action\.feedPaginationCursor[\s\S]*?case 'LOAD_MORE_FEEDS':[\s\S]*?feedPaginationCursor: action\.loadMoreButton[\s\S]*?action\.feedPaginationCursor/
  );
  assert.match(
    reducerSource,
    /case 'RESET_FEEDS':[\s\S]*?feedPaginationCursor: null/
  );
  assert.match(
    storiesSource,
    /feedPaginationCursor\?\.scopeKey === requestScopeKey[\s\S]*?\? feedPaginationCursor/
  );
  assert.doesNotMatch(storiesSource, /loadMoreCursorRef/);
  assert.match(
    reducerSource,
    /function appendUniqueHomeFeeds[\s\S]*?knownFeedIds\.has\(feedId\)[\s\S]*?knownFeedIds\.add\(feedId\)/
  );
});

test('load-more reports loading immediately and exposes recoverable failures', () => {
  const buttonSource = readSource(
    'src/components/Buttons/LoadMoreButton.tsx'
  );
  const storiesSource = readSource('src/containers/Home/Stories/index.tsx');
  const infiniteScrollSource = readSource(
    'src/helpers/hooks/useInfiniteScroll.ts'
  );

  assert.match(buttonSource, /loading=\{!!loading\}/);
  assert.doesNotMatch(buttonSource, /spinnerDelay|setTimeout/);
  assert.doesNotMatch(storiesSource, /LOADING_INDICATOR_GRACE_PERIOD_MS/);
  assert.match(
    storiesSource,
    /catch \(error\)[\s\S]*?Could not load more posts — Try Again/
  );
  assert.match(
    infiniteScrollSource,
    /try \{\s*await onScrollToBottom\(\);\s*\} finally \{[\s\S]*?loadingRef\.current = false/
  );
});
