import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeSharedMedia, refreshSharedMediaPage, removeSharedMediaMessage, sharedAttachmentPath, type SharedAttachment } from '../src/helpers/chatSharedMedia';
const item = (id: number, extra: Partial<SharedAttachment> = {}) => ({ id, topicId: 0, subchannelId: 0, subchannelPath: '', ...extra } as SharedAttachment);
test('older pages deduplicate records without skipping their continuation', () => {
  const page = mergeSharedMedia({ items: [item(9), item(8)], nextCursor: 8 }, { items: [item(8), item(7)], nextCursor: 7 });
  assert.deepEqual(page.items.map(row => row.id), [9,8,7]);
  assert.equal(page.nextCursor, 7);
});
test('head checks remove missing records within the scanned range and keep older pages', () => {
  const current = { items: [item(10), item(9), item(8), item(7), item(6)], nextCursor: 6 };
  const head = { items: [item(11), item(9)], nextCursor: 8 };
  const refreshed = refreshSharedMediaPage(current, head);
  assert.deepEqual(refreshed.items.map(row => row.id), [11, 9, 7, 6]);
  assert.equal(refreshed.nextCursor, 6);
  assert.deepEqual(refreshSharedMediaPage(current, { items: [item(9)], nextCursor: null }), { items: [item(9)], nextCursor: null }, 'an exhausted canonical head replaces the old list');
});
test('a head without overlap retains the canonical cursor so a burst leaves no gap', () => {
  const head = { items: [item(12), item(11)], nextCursor: 11 };
  assert.deepEqual(refreshSharedMediaPage({ items: [item(8)], nextCursor: 8 }, head), head);
  const sparse = { items: [], nextCursor: 10 };
  assert.deepEqual(refreshSharedMediaPage({ items: [item(8)], nextCursor: 8 }, sparse), sparse);
});
test('attachment navigation follows its actual topic and subchannel', () => {
  assert.equal(sharedAttachmentPath('friends', item(1)), '/chat/friends');
  assert.equal(sharedAttachmentPath('friends', item(1, { topicId: 22 })), '/chat/friends/topic/22');
  assert.equal(sharedAttachmentPath('friends', item(1, { subchannelId: 9, subchannelPath: 'art', topicId: 22 })), '/chat/friends/art/topic/22');
  assert.equal(sharedAttachmentPath('friends', item(1, { subchannelId: 9 })), null, 'a missing subchannel must not send a reply to the main conversation');
  assert.equal(sharedAttachmentPath('friends', item(1, { subchannelId: 9, subchannelPath: '../elsewhere' })), '/chat/friends/..%2Felsewhere');
});

test('canonical message removal preserves unrelated cached pages and pagination', () => {
  const all = { channelId: 11, checkedAt: 100, page: { items: [item(10), item(9)], nextCursor: 9 } };
  const files = { channelId: 11, checkedAt: 90, page: { items: [item(9)], nextCursor: null } };
  const other = { channelId: 12, checkedAt: 80, page: { items: [item(8)], nextCursor: 8 } };
  const cache = { all, files, other };
  const unchanged = removeSharedMediaMessage(cache, 11, 999);
  assert.equal(unchanged.all, all);
  assert.equal(unchanged.files, files);
  const removed = removeSharedMediaMessage(cache, 11, 9);
  assert.deepEqual(removed.all.page, { items: [item(10)], nextCursor: 9 });
  assert.deepEqual(removed.files.page, { items: [], nextCursor: null });
  assert.equal(removed.files.checkedAt, 90, 'a confirmed empty page stays loaded');
  assert.equal(removed.other, other);
});
