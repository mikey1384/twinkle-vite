import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveAIImageStatusImageUrl,
  shouldRecoverAIImageFromSocket
} from '../src/helpers/aiImageStatus';

test('AI image socket recovery is limited to unconfirmed transport loss', () => {
  assert.equal(
    shouldRecoverAIImageFromSocket({
      reachedServer: false,
      hasServerProgress: true
    }),
    true
  );
  assert.equal(
    shouldRecoverAIImageFromSocket({
      reachedServer: false,
      hasServerProgress: false,
      hasPendingCompletion: true
    }),
    true
  );
  assert.equal(
    shouldRecoverAIImageFromSocket({
      reachedServer: true,
      hasServerProgress: true,
      hasPendingCompletion: true
    }),
    false
  );
  assert.equal(
    shouldRecoverAIImageFromSocket({
      reachedServer: false,
      hasServerProgress: false
    }),
    false
  );
});

test('AI image status keeps an existing canonical image without recovery I/O', async () => {
  let recoveryCalls = 0;
  const imageUrl = await resolveAIImageStatusImageUrl({
    imageUrl: 'data:image/png;base64,AAAA',
    recovery: { objectKey: 'unused', format: 'png' },
    loadResult: async () => {
      recoveryCalls += 1;
      return { imageUrl: 'unexpected' };
    }
  });

  assert.equal(imageUrl, 'data:image/png;base64,AAAA');
  assert.equal(recoveryCalls, 0);
});

test('AI image status rehydrates a canonical completion from its private locator', async () => {
  const recovery = {
    objectKey: `ai-image-results/123/${'a'.repeat(64)}.png`,
    format: 'png'
  };
  const imageUrl = await resolveAIImageStatusImageUrl({
    recovery,
    loadResult: async (payload) => {
      assert.deepEqual(payload, { recovery });
      return { imageUrl: 'data:image/png;base64,BBBB' };
    }
  });

  assert.equal(imageUrl, 'data:image/png;base64,BBBB');
});

test('AI image status does not synthesize an image without canonical data', async () => {
  const imageUrl = await resolveAIImageStatusImageUrl({
    loadResult: async () => ({ imageUrl: 'unexpected' })
  });

  assert.equal(imageUrl, undefined);
});
