import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getCanonicalPinnedAICardIds } from '../src/containers/Profile/Body/Home/PinnedAICards/canonical';

const componentSource = readFileSync(
  new URL(
    '../src/containers/Profile/Body/Home/PinnedAICards/index.tsx',
    import.meta.url
  ),
  'utf8'
);
const selectionModalSource = readFileSync(
  new URL(
    '../src/components/Modals/SelectAICardModal/index.tsx',
    import.meta.url
  ),
  'utf8'
);

test('pinned AI Card state accepts only canonical server IDs', () => {
  assert.deepEqual(getCanonicalPinnedAICardIds({ cardIds: [9, 4] }), [9, 4]);
  assert.deepEqual(getCanonicalPinnedAICardIds({ cardIds: [] }), []);

  for (const payload of [
    null,
    {},
    { cardIds: '9,4' },
    { cardIds: [9, '4'] },
    { cardIds: [9, 0] }
  ]) {
    assert.throws(
      () => getCanonicalPinnedAICardIds(payload),
      /did not include canonical data/
    );
  }
});

test('profile pin loads and writes both consume the canonical validator', () => {
  assert.equal(
    componentSource.match(/getCanonicalPinnedAICardIds\(data\)/g)?.length,
    2
  );
  assert.doesNotMatch(
    componentSource,
    /Array\.isArray\(data\?\.cardIds\)[\s\S]*?:\s*cardIds/
  );
});

test('profile pin writes are gated until the canonical response arrives', () => {
  assert.match(componentSource, /if \(pinning\) return/);
  assert.match(componentSource, /submitting=\{pinning\}/);
  assert.match(selectionModalSource, /disabled=\{submitting\}/);
  assert.match(selectionModalSource, /loading=\{submitting\}/);
  assert.match(
    selectionModalSource,
    /closeOnBackdropClick=\{!submitting\}/
  );
});
