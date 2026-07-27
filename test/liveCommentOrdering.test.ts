import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  buildLiveCommentEntries,
  getFeedRowObservedAt,
  upsertLiveComments,
  withFeedRowsObservedAt
} from '../src/helpers/liveComments';
import { mergeLiveCommentState } from '../src/helpers/aiEnergySponsorship';

// The content context's default entry shape. Injected the same way the reducer
// injects it (the reducer itself imports ~/constants, which pulls in
// import.meta.env and cannot load outside vite — the wiring is pinned at the
// bottom of this file instead).
const createEntry = (contentId: number) => ({
  comments: [],
  contentId,
  contentType: 'comment',
  loaded: false
});

const COMMENT_ID = 4021;
const KEY = `comment${COMMENT_ID}`;

const placeholder = {
  id: COMMENT_ID,
  content: 'Ciel needs AI Energy to reply. Someone can sponsor this reply.',
  timeStamp: 1_784_786_325
};
const resolvedReply = {
  id: COMMENT_ID,
  content: 'HEHEHE here is the actual answer!',
  fileName: 'generated.png',
  filePath: 'ai/generated-path',
  timeStamp: 1_784_786_325
};

// what a server response (feed page or thread load) does to the store
function observeComments(state: any, comments: any[], observedAt: number) {
  return upsertLiveComments({
    state,
    entries: buildLiveCommentEntries(comments),
    observedAt,
    createEntry
  });
}

// what a socket `content_edited` does — EDIT_CONTENT spreads the stamped data
function observeBroadcast(state: any, data: any, observedAt: number) {
  return {
    ...state,
    [KEY]: { ...(state[KEY] || createEntry(COMMENT_ID)), ...data, liveObservedAt: observedAt }
  };
}

// 1. The reported bug: this client never got the broadcast, so its cached copy
// is the placeholder and the refreshed feed page is the freshest thing it has.
test('a refreshed feed page beats a cache that missed the broadcast', () => {
  const state = observeComments({}, [resolvedReply], 5000);

  assert.equal(state[KEY].content, resolvedReply.content);
  assert.equal(state[KEY].filePath, resolvedReply.filePath);
  // the entry must never claim the card is hydrated
  assert.equal(state[KEY].loaded, false);
  assert.equal(
    mergeLiveCommentState(placeholder, state[KEY]).content,
    resolvedReply.content
  );
});

// 2. The bug this precedence exists for: a broadcast arrived after the feed page
// was built, so the feed snapshot must not undo it.
test('a broadcast is never overwritten by a feed page requested earlier', () => {
  let state = observeComments({}, [placeholder], 5000);
  state = observeBroadcast(state, resolvedReply, 6000);
  // the same stale row re-renders, or another card carries it
  state = observeComments(state, [placeholder], 5000);

  assert.equal(state[KEY].content, resolvedReply.content);
  assert.equal(state[KEY].filePath, resolvedReply.filePath);
});

// 3. In-flight reorder: the request went out first and the broadcast landed
// while it was still in flight, so the arriving response is the older copy.
test('a broadcast that lands mid-request beats the response it raced', () => {
  const requestIssuedAt = 5000;
  let state = observeBroadcast({}, resolvedReply, 5200);
  state = observeComments(state, [placeholder], requestIssuedAt);

  assert.equal(state[KEY].content, resolvedReply.content);
});

// 4. No fill-once freeze: a later page still refreshes what an earlier one wrote.
test('a later feed page refreshes a comment an earlier page filled', () => {
  let state = observeComments({}, [placeholder], 5000);
  assert.equal(state[KEY].content, placeholder.content);

  state = observeComments(state, [resolvedReply], 7000);
  assert.equal(state[KEY].content, resolvedReply.content);
});

// Replies are comments with their own ids, so they go stale the same way.
test('nested replies are synced as their own entries', () => {
  const state = observeComments(
    {},
    [
      {
        id: 900,
        content: 'parent',
        replies: [{ id: 901, content: 'reply', replies: [{ id: 902 }] }]
      }
    ],
    5000
  );

  assert.equal(state.comment900.content, 'parent');
  assert.equal(state.comment901.content, 'reply');
  // 902 carries no live fields, so it never becomes an entry
  assert.equal(state.comment902, undefined);
});

// A row that omits a field says nothing about it; only present fields apply.
test('a partial row never blanks fields the entry already holds', () => {
  let state = observeComments({}, [resolvedReply], 5000);
  state = observeComments(
    state,
    [{ id: COMMENT_ID, content: 'edited text' }],
    6000
  );

  assert.equal(state[KEY].content, 'edited text');
  assert.equal(state[KEY].filePath, resolvedReply.filePath);
});

// The sync runs on every feed render, so an unchanged row must not churn state.
test('an unchanged row leaves state identity alone', () => {
  const state = observeComments({}, [resolvedReply], 5000);

  assert.equal(observeComments(state, [resolvedReply], 9000), state);
});

test('an unstamped row can never win against the cache', () => {
  // rows built locally from an upload response carry no request time
  assert.equal(getFeedRowObservedAt({ id: 4 }), 0);
  const cached = { [KEY]: { content: 'cached' } };

  assert.equal(observeComments(cached, [resolvedReply], 0), cached);
});

test('rows are stamped with the moment their request was issued', () => {
  const page = withFeedRowsObservedAt(
    { feeds: [{ id: 1 }, { id: 2 }], loadMoreButton: true },
    4242
  );

  assert.equal(getFeedRowObservedAt(page.feeds[0]), 4242);
  assert.equal(getFeedRowObservedAt(page.feeds[1]), 4242);
  assert.equal(page.loadMoreButton, true);
  // newFeeds returns a bare array of rows
  assert.equal(
    getFeedRowObservedAt(withFeedRowsObservedAt([{ id: 3 }], 7)[0]),
    7
  );
});

// The rule above is only worth anything if every writer actually goes through
// it. These pin the wiring the pure tests cannot reach.
test('every server response that carries comments feeds the rule', () => {
  const reducerSource = readFileSync(
    new URL('../src/contexts/Content/reducer.ts', import.meta.url),
    'utf8'
  );
  const actionsSource = readFileSync(
    new URL('../src/contexts/Content/actions.ts', import.meta.url),
    'utf8'
  );
  const feedCardSource = readFileSync(
    new URL(
      '../src/containers/Home/Stories/FeedCard/index.tsx',
      import.meta.url
    ),
    'utf8'
  );
  const requestSource = readFileSync(
    new URL('../src/contexts/requestHelpers/content.ts', import.meta.url),
    'utf8'
  );

  // thread loads and the feed sync both upsert
  assert.match(reducerSource, /case 'LOAD_COMMENTS': \{[\s\S]*?syncLiveComments\(/);
  assert.match(reducerSource, /case 'SYNC_SERVER_COMMENTS':[\s\S]*?upsertLiveComments\(/);
  // a new entry is never born hydrated
  const createEntrySource = reducerSource.match(
    /function createLiveCommentEntry\(contentId: number\) \{[\s\S]*?\n\}/
  );
  assert.ok(createEntrySource, 'createLiveCommentEntry must exist');
  assert.doesNotMatch(createEntrySource[0], /loaded/);
  // edits and canonical loads stamp when they were observed
  assert.match(actionsSource, /type: 'EDIT_COMMENT',[\s\S]*?observedAt: getLiveObservedAt\(\)/);
  assert.match(actionsSource, /type: 'LOAD_COMMENTS',[\s\S]*?observedAt: getLiveObservedAt\(\)/);
  assert.match(actionsSource, /data: stampLiveComment\(\{ contentType, data \}\)/);
  // every feed row that reaches a card was stamped at request time
  assert.equal(
    requestSource.match(/withFeedRowsObservedAt\(/g)?.length,
    4,
    'loadFeeds, loadLikedFeeds, loadFeedsByUser and loadNewFeeds must all stamp'
  );
  assert.match(feedCardSource, /onSyncServerComments\(\{/);
});
