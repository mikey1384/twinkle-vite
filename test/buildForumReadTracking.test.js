import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const panelSource = readFileSync(
  new URL(
    '../src/containers/Build/Editor/CollaborationPanel/index.tsx',
    import.meta.url
  ),
  'utf8'
);
const requestHelpersSource = readFileSync(
  new URL('../src/contexts/requestHelpers/build.ts', import.meta.url),
  'utf8'
);
const requestRegistrySource = readFileSync(
  new URL('../src/contexts/requestHelpers/index.ts', import.meta.url),
  'utf8'
);
const panelStateSource = readFileSync(
  new URL(
    '../src/containers/Build/Editor/CollaborationPanel/helpers/panelState.ts',
    import.meta.url
  ),
  'utf8'
);

test('Forum read positions use the shared append sequence', () => {
  assert.match(panelStateSource, /rawPosition\.activitySeq/);
  assert.match(
    panelStateSource,
    /return left\.activitySeq - right\.activitySeq/
  );
  assert.doesNotMatch(panelStateSource, /sourceRank|sortId/);
});

test('Forum viewed acknowledgement sends the server snapshot to the API', () => {
  assert.match(
    requestHelpersSource,
    /markBuildContributionForumViewed[\s\S]*?request\.put\([\s\S]*?contribution-forum-viewed[\s\S]*?forumActivityPosition/
  );
  assert.match(requestRegistrySource, /'markBuildContributionForumViewed'/);
});

test('background Forum hydration does not acknowledge an unrendered Forum', () => {
  assert.match(
    panelSource,
    /const forumRendered = Boolean\([\s\S]*?contentExpanded[\s\S]*?!selectedContribution/
  );
  const hydrationStart = panelSource.indexOf(
    'async function reloadForumThreads'
  );
  const acknowledgementStart = panelSource.indexOf(
    'async function acknowledgeForumScopeViewed',
    hydrationStart
  );
  const hydrationSource = panelSource.slice(
    hydrationStart,
    acknowledgementStart
  );
  assert.match(
    hydrationSource,
    /result\?\.forumActivityPosition[\s\S]*?forumActivityPositionByScopeRef\.current/
  );
  assert.doesNotMatch(hydrationSource, /acknowledgeForumScopeViewed\(/);
});

test('late Forum hydration cannot acknowledge after the Team panel unmounts', () => {
  assert.match(
    panelSource,
    /panelMountedRef\.current = true[\s\S]*?return \(\) => \{[\s\S]*?panelMountedRef\.current = false[\s\S]*?forumRenderedRef\.current = false/
  );
  assert.match(
    panelSource,
    /const nextThreads[\s\S]*?if \(\s*!panelMountedRef\.current \|\|[\s\S]*?activeForumScopeIdentityRef\.current !== requestForumScopeIdentity/
  );
  assert.match(
    panelSource,
    /async function acknowledgeForumScopeViewed[\s\S]*?!panelMountedRef\.current \|\|[\s\S]*?!forumRenderedRef\.current/
  );
});

test('opening a hydrated Forum acknowledges its canonical position', () => {
  assert.match(
    panelSource,
    /previousForumRenderedRef\.current = forumRendered[\s\S]*?forumActivityPositionByScopeRef\.current\[forumScopeIdentity\][\s\S]*?acknowledgeForumScopeViewed/
  );
});

test('hydrated Forum positions are acknowledged after thread state commits', () => {
  assert.match(
    panelSource,
    /if \(!forumRendered\) return;[\s\S]*?forumActivityPositionByScopeRef\.current\[forumScopeIdentity\][\s\S]*?acknowledgeForumScopeViewed[\s\S]*?forumThreads/
  );
});

test('dedupe state advances only from the canonical acknowledgement response', () => {
  const requestIndex = panelSource.indexOf(
    'await markBuildContributionForumViewed'
  );
  const responseIndex = panelSource.indexOf(
    'result?.forumReadPosition',
    requestIndex
  );
  const canonicalWriteIndex = panelSource.indexOf(
    'lastMarkedForumPositionByScopeRef.current[scopeIdentity] =',
    responseIndex
  );
  assert.ok(requestIndex >= 0);
  assert.ok(responseIndex > requestIndex);
  assert.ok(canonicalWriteIndex > responseIndex);
});
