import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  getCanonicalPinnedAICardIds,
  getCanonicalPinnedAICardsLoadPayload
} from '../src/containers/Profile/Body/Home/PinnedAICards/canonical';
import {
  getCanonicalPinnedBuildsLoadPayload,
  getCanonicalPinnedBuildsWritePayload
} from '../src/containers/Profile/Body/Home/Builds/canonical';

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
    1
  );
  assert.match(componentSource, /getCanonicalPinnedAICardsLoadPayload\(data\)/);
  assert.doesNotMatch(
    componentSource,
    /Array\.isArray\(data\?\.cardIds\)[\s\S]*?:\s*cardIds/
  );
});

test('pinned profile loads require explicit canonical fallback state', () => {
  assert.deepEqual(
    getCanonicalPinnedAICardsLoadPayload({
      cardIds: [9],
      cards: [{ id: 9 }],
      isTopCards: false
    }),
    { cardIds: [9], cards: [{ id: 9 }], isTopCards: false }
  );
  assert.throws(
    () =>
      getCanonicalPinnedAICardsLoadPayload({
        cardIds: [9],
        cards: [{ id: 9 }]
      }),
    /canonical display data/
  );

  assert.deepEqual(
    getCanonicalPinnedBuildsLoadPayload({
      buildIds: [4],
      builds: [{ id: 4 }],
      isTopBuilds: true
    }),
    { buildIds: [4], builds: [{ id: 4 }], isTopBuilds: true }
  );
  assert.throws(
    () =>
      getCanonicalPinnedBuildsLoadPayload({
        buildIds: [4],
        builds: [{ id: 4 }]
      }),
    /canonical display data/
  );
  assert.deepEqual(
    getCanonicalPinnedBuildsWritePayload({
      buildIds: [4],
      builds: [{ id: 4 }]
    }),
    { buildIds: [4], builds: [{ id: 4 }] }
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
