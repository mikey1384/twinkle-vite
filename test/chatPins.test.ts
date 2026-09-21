import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mergePinPage,
  chatPinPreview,
  type ChatPinSnapshot
} from '../src/helpers/chatPins';

function snapshot(revision: number, ids: number[], all = ids): ChatPinSnapshot {
  return {
    channelId: 20,
    subchannelId: 0,
    topicId: 0,
    revision,
    canManage: true,
    pins: ids.map((id) => ({ id, messageId: id, content: 'hello' }) as any),
    pinnedMessageIds: all,
    total: all.length,
    nextCursor: null
  };
}

test('a delayed pin response cannot resurrect a message unpinned by the other participant', () => {
  const unpinned = snapshot(3, []);
  assert.equal(mergePinPage(unpinned, snapshot(2, [5])), unpinned);
});

test('pages deduplicate pins and honor the latest canonical membership', () => {
  const result = mergePinPage(
    snapshot(3, [5, 4], [5, 4, 3]),
    snapshot(3, [4, 3], [5, 3]),
    true
  );
  assert.deepEqual(
    result.pins.map((pin) => pin.messageId),
    [5, 3]
  );
});

test('a new pin revision replaces previously loaded pages instead of mixing generations', () => {
  const result = mergePinPage(snapshot(3, [5, 4]), snapshot(4, [8]), true);
  assert.deepEqual(
    result.pins.map((pin) => pin.messageId),
    [8]
  );
});

test('attachment-only pins have readable previews and text remains unmodified', () => {
  assert.equal(
    chatPinPreview({ content: '', fileName: 'Plan.pdf' }),
    'Attachment: Plan.pdf'
  );
  assert.equal(chatPinPreview({ content: 'hello\nworld' }), 'hello\nworld');
});
