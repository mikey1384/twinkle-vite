import assert from 'node:assert/strict';
import test from 'node:test';
import { applyCanonicalChatAttachmentThumbnail } from '../src/contexts/Chat/attachmentThumbnailState';

test('canonical thumbnail updates only an already-loaded chat message', () => {
  const channel = {
    messagesObj: {
      8: { id: 8, thumbUrl: null, content: 'file' }
    }
  } as any;
  const updated = applyCanonicalChatAttachmentThumbnail({
    channel,
    subchannelId: 0,
    messageId: 8,
    thumbUrl: 'https://example.test/thumb.png'
  });
  assert.equal(
    updated.messagesObj[8].thumbUrl,
    'https://example.test/thumb.png'
  );

  const unchanged = applyCanonicalChatAttachmentThumbnail({
    channel: updated,
    subchannelId: 0,
    messageId: 999,
    thumbUrl: 'https://example.test/unknown.png'
  });
  assert.equal(unchanged, updated);
});

test('canonical thumbnail updates the matching loaded subchannel only', () => {
  const channel = {
    messagesObj: { 8: { id: 8, thumbUrl: 'main' } },
    subchannelObj: {
      3: {
        messagesObj: {
          8: { id: 8, thumbUrl: null }
        }
      }
    }
  } as any;
  const updated = applyCanonicalChatAttachmentThumbnail({
    channel,
    subchannelId: 3,
    messageId: 8,
    thumbUrl: 'https://example.test/thumb.png'
  });
  assert.equal(
    updated.subchannelObj[3].messagesObj[8].thumbUrl,
    'https://example.test/thumb.png'
  );
  assert.equal(updated.messagesObj[8].thumbUrl, 'main');
});
