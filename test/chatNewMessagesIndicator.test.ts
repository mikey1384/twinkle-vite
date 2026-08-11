import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { countConfirmedRealtimeMessageArrivals } from '../src/containers/Chat/Body/MessagesContainer/newMessageIndicator';

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const reducerSource = readSource('src/contexts/Chat/reducer.ts');
const displayedMessagesSource = readSource(
  'src/containers/Chat/Body/MessagesContainer/DisplayedMessages.tsx'
);

test('isNewMessage is stamped on the receiving client, never trusted from the wire', () => {
  // The socket server rebuilds browser-relayed messages from the canonical DB
  // row, so sender-attached flags never survive. The indicator's trigger must
  // come from RECEIVE_MESSAGE stamping arrivals locally.
  const receiveMessageCase =
    reducerSource.match(
      /case 'RECEIVE_MESSAGE':[\s\S]*?(?=\n    case 'RECEIVE_FIRST_MSG')/
    )?.[0] || '';
  assert.equal(
    receiveMessageCase.match(/isNewMessage: !action\.isMyMessage/g)?.length,
    2,
    'both the main-scope and subchannel writes must stamp isNewMessage'
  );

  // No client should stamp the flag onto outgoing socket payloads anymore —
  // it is dead weight that misleads readers into thinking it survives relay.
  for (const path of [
    'src/containers/App/index.tsx',
    'src/containers/Chat/Message/MessageBody/hooks/useOptimisticSave.ts'
  ]) {
    assert.ok(
      !readSource(path).includes('isNewMessage'),
      `${path} must not stamp isNewMessage onto socket payloads`
    );
  }
});

test('unseen count handles batched confirmed arrivals and ignores local or loaded rows', () => {
  const messages = [
    { id: 13, userId: 9, isNewMessage: true },
    { id: 12, userId: '9', isNewMessage: true },
    { id: 11, userId: 4, isNewMessage: true },
    { id: 10, userId: 7 }
  ];
  assert.equal(
    countConfirmedRealtimeMessageArrivals({
      messages,
      previousNewestMessageId: 10,
      viewerUserId: 4
    }),
    2
  );
  assert.equal(
    countConfirmedRealtimeMessageArrivals({
      messages,
      previousNewestMessageId: 13,
      viewerUserId: 4
    }),
    0
  );
  assert.equal(
    countConfirmedRealtimeMessageArrivals({
      messages,
      previousNewestMessageId: 999,
      viewerUserId: 4
    }),
    0
  );
});

test('unseen count is diffed from the newest edge and reset at exact UI scopes', () => {
  // Per-message mount effects undercount when several messages land in one
  // React commit, so the count must come from diffing against the previously
  // newest message id and must ignore my own and non-realtime messages.
  const countEffect =
    displayedMessagesSource.match(
      /const prevNewestMessageIdRef[\s\S]*?\[messages, unseenMessageScopeKey, userId\]\);/
    )?.[0] || '';
  assert.match(countEffect, /countConfirmedRealtimeMessageArrivals/);
  assert.match(countEffect, /scrolledToBottomRef\.current\) return;/);
  assert.match(
    countEffect,
    /setUnseenMessageCount\(\(count\) => count \+ arrivedCount\)/
  );

  // Switching channel, subchannel, topic, tab, or search mode resets the count
  // and establishes the currently rendered newest row as the new baseline.
  assert.match(countEffect, /prevUnseenMessageScopeKeyRef/);
  assert.match(countEffect, /selectedTab === 'topic'/);
  assert.match(countEffect, /appliedTopicId/);
  assert.match(countEffect, /subchannel\?\.id/);
  assert.match(countEffect, /isSearchActive/);
  assert.match(
    countEffect,
    /prevNewestMessageIdRef\.current = newestMessageId/
  );
  assert.match(countEffect, /setUnseenMessageCount\(0\)/);

  // Reaching the bottom clears the indicator.
  assert.match(
    displayedMessagesSource,
    /if \(scrollTop >= unseenButtonThreshold\) \{\s*setUnseenMessageCount\(0\);/
  );
});

test('indicator button takes precedence over go-to-bottom and scrolls on click', () => {
  const buttonBlock =
    displayedMessagesSource.match(
      /\{unseenMessageCount > 0 \? \([\s\S]*?\) : showGoToBottom \? \(/
    )?.[0] || '';
  assert.match(buttonBlock, /<NewMessagesButton/);
  assert.match(buttonBlock, /count=\{unseenMessageCount\}/);
  assert.match(
    buttonBlock,
    /setUnseenMessageCount\(0\);\s*onScrollToBottom\(\);/
  );
});
