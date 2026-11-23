import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  buildPosObj,
  definitionsByPos,
  normalizeDefinitionOrder,
  normalizePosOrder
} from '../src/containers/Chat/Body/Collect/Vocabulary/WordModal/wordShape';

// 11-23 crash (website 2.6.29, Blackstar): a Monster Den battle ended, the Den
// opened WordModal, and its first render saw the word before the unlocked
// definitions reached wordsObj. The modal kept that render's definitionOrder
// (undefined) in state, so the next render, now with definitions, threw
// "Cannot read properties of undefined (reading 'noun')" at
// `definitionOrder[pos]` in DictionaryTab.
const unlocked = {
  content: 'encoder',
  id: 36336,
  noun: [
    { id: 139491, definition: 'a device that converts information' },
    { id: 139492, definition: 'a program that encodes data' }
  ],
  deletedDefIds: [],
  partOfSpeechOrder: ['noun'],
  definitionOrder: { noun: [139491, 139492] },
  battle: { played: true, status: 'lost' }
};

function modalView(wordObj: Record<string, any>) {
  const partOfSpeeches = definitionsByPos(wordObj);
  const posObj = buildPosObj(partOfSpeeches);
  const definitionOrder = normalizeDefinitionOrder(wordObj.definitionOrder, partOfSpeeches);
  const posOrder = normalizePosOrder(wordObj.partOfSpeechOrder).filter(
    (pos) => Object.keys(posObj[pos] || {}).length > 0
  );
  // What DictionaryTab renders for each part of speech.
  return posOrder.map((pos) => ({
    pos,
    titles: (definitionOrder[pos] || []).map((id) => posObj[pos][id]?.title)
  }));
}

test('the order follows the word once its definitions arrive', () => {
  // First render: the word is not in wordsObj yet.
  assert.deepEqual(modalView({}), []);
  // Next render: the unlocked definitions are there.
  assert.deepEqual(modalView(unlocked), [
    {
      pos: 'noun',
      titles: ['a device that converts information', 'a program that encodes data']
    }
  ]);
});

test('definitions without an order (missing, null, a string) still show', () => {
  for (const definitionOrder of [undefined, null, '{"noun":[139491]}', []]) {
    assert.deepEqual(
      modalView({ ...unlocked, definitionOrder }),
      [
        {
          pos: 'noun',
          titles: ['a device that converts information', 'a program that encodes data']
        }
      ],
      `definitionOrder ${JSON.stringify(definitionOrder)}`
    );
  }
  // An order missing one part of speech falls back for that one only.
  assert.deepEqual(
    normalizeDefinitionOrder(
      { verb: [5] },
      definitionsByPos({ noun: [{ id: 1, definition: 'a' }], verb: [{ id: 5, definition: 'b' }] })
    ),
    { noun: [1], verb: [5] }
  );
});

test('malformed parts of speech are skipped, never read through', () => {
  const view = modalView({
    noun: null,
    verb: { id: 9 },
    adjective: [null, { definition: 'no id' }, { id: 3, definition: 'kept' }],
    partOfSpeechOrder: 'noun,verb',
    definitionOrder: { adjective: [3] }
  });
  assert.deepEqual(view, [{ pos: 'adjective', titles: ['kept'] }]);
  assert.deepEqual(normalizePosOrder(['verb', 7, null]), ['verb']);
});

test('WordModal reads the live order, not a first-render snapshot', () => {
  const source = readFileSync(
    new URL('../src/containers/Chat/Body/Collect/Vocabulary/WordModal/index.tsx', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(source, /useState\(definitionOrder\)/);
  assert.match(source, /definitionOrderEdit \?\? definitionOrder/);
  const dictionaryTab = readFileSync(
    new URL(
      '../src/containers/Chat/Body/Collect/Vocabulary/WordModal/DictionaryTab/index.tsx',
      import.meta.url
    ),
    'utf8'
  );
  assert.match(dictionaryTab, /definitionOrder\?\.\[pos\]/);
});
