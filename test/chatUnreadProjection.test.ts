import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  canonicalUnreadBadgeIsShown,
  channelHasCanonicalUnread,
  hasVisibleCanonicalChatUnread,
  projectCanonicalUnreadChannelLists
} from '../src/helpers/chatUnreadProjection';

const channelMenuSource = readFileSync(
  new URL(
    '../src/containers/Chat/LeftMenu/Channels/Channel.tsx',
    import.meta.url
  ),
  'utf8'
);
const subchannelMenuSource = readFileSync(
  new URL(
    '../src/containers/Chat/LeftMenu/Subchannels/Subchannel.tsx',
    import.meta.url
  ),
  'utf8'
);

test('an active scope suppresses its navigation badge without changing canonical state', () => {
  assert.equal(canonicalUnreadBadgeIsShown(1), true);
  assert.equal(canonicalUnreadBadgeIsShown('2'), true);
  assert.equal(canonicalUnreadBadgeIsShown(0), false);
  assert.equal(canonicalUnreadBadgeIsShown(Number.NaN), false);
  assert.equal(canonicalUnreadBadgeIsShown(-1), false);
  assert.match(
    channelMenuSource,
    /badgeShown =\s*!selected && canonicalUnreadBadgeIsShown\(totalNumUnreads\)/
  );
  assert.match(
    subchannelMenuSource,
    /badgeShown =\s*!subchannelSelected && canonicalUnreadBadgeIsShown\(numUnreads\)/
  );
});

test('a listed channel or subchannel unread is a visible canonical badge', () => {
  assert.equal(channelHasCanonicalUnread({ numUnreads: 2 }), true);
  assert.equal(
    channelHasCanonicalUnread({
      numUnreads: 0,
      subchannelObj: { 7: { numUnreads: 1 } }
    }),
    true
  );
});

test('hidden, unlisted, and read channels cannot light the top Chat nav', () => {
  const channelsObj = {
    1: { id: 1, numUnreads: 0 },
    2: { id: 2, numUnreads: 1, isHidden: true },
    3: { id: 3, numUnreads: 1 }
  };
  assert.equal(
    hasVisibleCanonicalChatUnread({
      channelsObj,
      homeChannelIds: [1, 2],
      favoriteChannelIds: [],
      classChannelIds: []
    }),
    false
  );
  assert.equal(
    hasVisibleCanonicalChatUnread({
      channelsObj,
      homeChannelIds: [1, 2, 3],
      favoriteChannelIds: [],
      classChannelIds: []
    }),
    true
  );
});

test('a canonical unread summary restores every visible channel list projection', () => {
  assert.deepEqual(
    projectCanonicalUnreadChannelLists({
      channelId: 7,
      isClass: true,
      favorited: true,
      homeChannelIds: [3],
      favoriteChannelIds: [4],
      classChannelIds: [5]
    }),
    {
      homeChannelIds: [7, 3],
      favoriteChannelIds: [7, 4],
      classChannelIds: [7, 5]
    }
  );
});

test('canonical channel kind and favorite membership remove stale list entries', () => {
  assert.deepEqual(
    projectCanonicalUnreadChannelLists({
      channelId: 7,
      isClass: false,
      favorited: false,
      homeChannelIds: [7, 3],
      favoriteChannelIds: [7, 4],
      classChannelIds: [7, 5]
    }),
    {
      homeChannelIds: [7, 3],
      favoriteChannelIds: [4],
      classChannelIds: [5]
    }
  );
});
