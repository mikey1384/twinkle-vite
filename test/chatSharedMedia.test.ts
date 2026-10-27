import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeSharedMedia, sharedAttachmentPath, type SharedAttachment } from '../src/helpers/chatSharedMedia';
const item = (id: number, extra: Partial<SharedAttachment> = {}) => ({ id, topicId: 0, subchannelId: 0, subchannelPath: '', ...extra } as SharedAttachment);
test('older pages deduplicate records without skipping their continuation', () => {
  const page = mergeSharedMedia({ items: [item(9), item(8)], nextCursor: 8 }, { items: [item(8), item(7)], nextCursor: 7 });
  assert.deepEqual(page.items.map(row => row.id), [9,8,7]);
  assert.equal(page.nextCursor, 7);
});
test('attachment navigation follows its actual topic and subchannel', () => {
  assert.equal(sharedAttachmentPath('friends', item(1)), '/chat/friends');
  assert.equal(sharedAttachmentPath('friends', item(1, { topicId: 22 })), '/chat/friends/topic/22');
  assert.equal(sharedAttachmentPath('friends', item(1, { subchannelId: 9, subchannelPath: 'art', topicId: 22 })), '/chat/friends/art/topic/22');
  assert.equal(sharedAttachmentPath('friends', item(1, { subchannelId: 9 })), null, 'a missing subchannel must not send a reply to the main conversation');
  assert.equal(sharedAttachmentPath('friends', item(1, { subchannelId: 9, subchannelPath: '../elsewhere' })), '/chat/friends/..%2Felsewhere');
});
