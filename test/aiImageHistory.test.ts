import assert from 'node:assert/strict';
import test from 'node:test';

import {
  describeAIImageSource,
  findResumableAIImage,
  mergeAIImageHistoryPages,
  replaceAIImageHistoryFirstPage,
  resumableAIImageSources,
  type AIImageHistoryItem
} from '../src/helpers/aiImageHistory';

function item(
  id: number,
  overrides: Partial<AIImageHistoryItem> = {}
): AIImageHistoryItem {
  return {
    id,
    status: 'completed',
    requestId: `upload-image-initial-${id}`,
    source: 'generator',
    buildId: null,
    prompt: `image ${id}`,
    engine: 'openai',
    model: null,
    quality: 'high',
    isFollowUp: false,
    path: `ai-image-results/1/${String(id).padStart(64, '0')}.png`,
    createdAt: id,
    completedAt: id,
    ...overrides
  };
}

test('Make Images resumes only its own kind of running generation', () => {
  const makeImages = resumableAIImageSources();
  const thumbnails = resumableAIImageSources('buildThumbnail');
  assert.deepEqual(makeImages, ['generator', 'edit']);
  assert.deepEqual(thumbnails, ['thumbnail']);
  assert.equal(findResumableAIImage([item(3), item(2)], makeImages), null);
  const elsewhere = (
    ['picture_day', 'build_app', 'zero_ciel', 'thumbnail'] as const
  ).map((source, index) =>
    item(10 + index, { status: 'processing', source, path: null })
  );
  assert.equal(findResumableAIImage(elsewhere, makeImages), null);
  assert.equal(
    findResumableAIImage(elsewhere, thumbnails)?.source,
    'thumbnail'
  );
  const running = item(5, { status: 'processing', path: null });
  assert.equal(findResumableAIImage([running, item(4)], makeImages), running);
  const editing = item(6, { status: 'processing', source: 'edit', path: null });
  assert.equal(findResumableAIImage([editing], makeImages), editing);
  assert.equal(findResumableAIImage([editing], thumbnails), null);
  assert.equal(
    findResumableAIImage(
      [item(7, { status: 'failed', path: null })],
      makeImages
    ),
    null
  );
});

test('refreshing the first page keeps older pages and drops nothing twice', () => {
  const loaded = [item(10), item(9), item(8), item(7), item(6)];
  const refreshed = replaceAIImageHistoryFirstPage(loaded, [
    item(11),
    item(10),
    item(9, { prompt: 'updated' })
  ]);
  assert.deepEqual(
    refreshed.map((image) => image.id),
    [11, 10, 9, 8, 7, 6]
  );
  assert.equal(refreshed[2].prompt, 'updated');
  assert.deepEqual(
    mergeAIImageHistoryPages(refreshed, [item(6), item(5)]).map(
      (image) => image.id
    ),
    [11, 10, 9, 8, 7, 6, 5]
  );
});

test('the source label names where an image was made', () => {
  assert.equal(
    describeAIImageSource(item(1, { source: 'picture_day' })),
    'Picture Day'
  );
  assert.equal(
    describeAIImageSource(item(1, { source: 'build_app' })),
    'In an app'
  );
  assert.equal(describeAIImageSource(item(1, { isFollowUp: true })), 'Edit');
  assert.equal(describeAIImageSource(item(1, { source: 'edit' })), 'Edit');
  assert.equal(
    describeAIImageSource(item(1, { source: 'zero_ciel' })),
    'Zero/Ciel'
  );
  assert.equal(
    describeAIImageSource(item(1, { source: 'thumbnail' })),
    'Thumbnail'
  );
  assert.equal(describeAIImageSource(item(1)), '');
});
