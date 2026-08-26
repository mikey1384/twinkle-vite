import assert from 'node:assert/strict';
import test from 'node:test';
import { applyCanonicalTextStreamUpdate } from '../src/helpers/canonicalTextStream';

test('AI Story deltas append while canonical snapshots replace without duplicating words', () => {
  let rendered = '';
  rendered = applyCanonicalTextStreamUpdate({
    currentText: rendered,
    delta: 'same ',
    startOffset: 0
  });
  rendered = applyCanonicalTextStreamUpdate({
    currentText: rendered,
    delta: 'word',
    startOffset: 5
  });
  assert.equal(rendered, 'same word');

  rendered = applyCanonicalTextStreamUpdate({
    currentText: rendered,
    delta: 'word',
    startOffset: 5
  });
  assert.equal(rendered, 'same word');

  rendered = applyCanonicalTextStreamUpdate({
    currentText: rendered,
    snapshot: 'same word'
  });
  assert.equal(rendered, 'same word');

  rendered = applyCanonicalTextStreamUpdate({
    currentText: rendered,
    snapshot: ''
  });
  rendered = applyCanonicalTextStreamUpdate({
    currentText: rendered,
    delta: 'confirmed retry'
  });
  assert.equal(rendered, 'confirmed retry');
});
