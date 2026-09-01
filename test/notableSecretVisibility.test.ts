import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ProfileReducer from '../src/contexts/Profile/reducer';

function readSource(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

function getSourceBetween(source: string, start: string, end: string) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.notEqual(startIndex, -1, `Missing source marker: ${start}`);
  assert.notEqual(endIndex, -1, `Missing source marker: ${end}`);
  return source.slice(startIndex, endIndex);
}

test('noteworthy requests carry the viewer identity used by secret visibility', () => {
  const requestSource = readSource(
    '../src/contexts/requestHelpers/content.ts'
  );
  const loadMoreSource = getSourceBetween(
    requestSource,
    'async loadMoreNotableContents',
    'async loadNotableContent'
  );
  const initialLoadSource = getSourceBetween(
    requestSource,
    'async loadNotableContent',
    'async loadNewFeeds'
  );

  assert.match(loadMoreSource, /\/content\/noteworthy[\s\S]*,\s*auth\(\)/);
  assert.match(initialLoadSource, /\/content\/noteworthy[\s\S]*,\s*auth\(\)/);
});

test('the secret-visibility fix has a unique website client version', () => {
  const defaultValuesSource = readSource('../src/constants/defaultValues.ts');

  assert.match(defaultValuesSource, /clientVersion = '2\.1\.11'/);
});

test('viewer changes discard cached noteworthy secret visibility', () => {
  const state = {
    alice: {
      notables: {
        feeds: [
          {
            contentId: 20,
            secretAnswer: 'viewer-specific secret',
            secretShown: true
          }
        ],
        loaded: true,
        loadMoreButton: true
      },
      subjects: {
        posts: [],
        loaded: true,
        loadMoreButton: false
      },
      pinnedAICards: {
        cardIds: [4],
        loaded: true
      }
    }
  };

  const nextState = ProfileReducer(state, {
    type: 'RESET_PROFILE_VIEWER_STATE'
  });

  assert.deepEqual(nextState.alice.notables, {
    feeds: [],
    loaded: false,
    loadMoreButton: false
  });
  assert.equal(nextState.alice.pinnedAICards, state.alice.pinnedAICards);
});

test('every noteworthy response is rejected after the viewer changes', () => {
  const compactProfileSource = readSource(
    '../src/containers/Profile/Body/Home/Activities/index.tsx'
  );
  const configurableProfileSource = readSource(
    '../src/containers/Profile/Body/Home/index.tsx'
  );
  const notableListSource = readSource(
    '../src/containers/Profile/Body/Home/Activities/NotableActivities/index.tsx'
  );
  const staleResponseGuard =
    /await loadNotableContent[\s\S]*if \(checkUserChange\(requestUserId\)\) return;[\s\S]*onLoadNotables/;

  assert.match(compactProfileSource, staleResponseGuard);
  assert.match(configurableProfileSource, staleResponseGuard);
  assert.match(
    notableListSource,
    /await loadMoreNotableContents[\s\S]*if \(checkUserChange\(requestUserId\)\) return;[\s\S]*onLoadMoreNotables/
  );
});
