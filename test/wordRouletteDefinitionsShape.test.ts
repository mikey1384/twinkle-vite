import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { applyAIGeneratedDefinitions } from '../src/contexts/Chat/aiGeneratedDefinitions';

// 11-22 crash (website 2.6.24, /chat/vocabulary): the roulette's already-spun
// answer for an unbattled word carried a locked word object, and its
// `battle` field crashed APPLY_AI_GENERATED_DEFINITIONS and the whole app.
test('a locked word object from the roulette is skipped, not mapped', () => {
  const lockedResponse = {
    noun: [],
    verb: [],
    adjective: [],
    deletedDefIds: [],
    battle: { wordId: 216553, locked: true },
    adverb: null,
    other: { id: 9 }
  };
  const result = applyAIGeneratedDefinitions({
    wordObj: { content: 'overlend', id: 7 },
    partOfSpeeches: lockedResponse,
    partOfSpeechOrder: ['verb']
  });
  assert.equal(result.battle, undefined);
  assert.equal(result.adverb, undefined);
  assert.equal(result.other, undefined);
  assert.deepEqual(result.verb, []);
  assert.deepEqual(result.definitionOrder.verb, []);
  assert.equal(result.definitionOrder.battle, undefined);
  assert.deepEqual(result.partOfSpeechOrder, ['verb']);
  assert.equal(result.id, 7);
});

test('real definitions still apply, and bad containers never throw', () => {
  const result = applyAIGeneratedDefinitions({
    wordObj: undefined,
    partOfSpeeches: { verb: [{ id: 302131, definition: 'To lend too much.' }, null] },
    partOfSpeechOrder: '["verb"]'
  });
  assert.deepEqual(result.definitionOrder, { verb: [302131] });
  assert.deepEqual(result.verb, [{ id: 302131, definition: 'To lend too much.' }]);
  assert.deepEqual(result.partOfSpeechOrder, ['verb']);
  for (const partOfSpeeches of [null, undefined, 'x', 3]) {
    assert.deepEqual(
      applyAIGeneratedDefinitions({ wordObj: {}, partOfSpeeches, partOfSpeechOrder: [] })
        .definitionOrder,
      {}
    );
  }
});

test('the reducer case goes through the defensive merge', () => {
  const reducer = readFileSync(new URL('../src/contexts/Chat/reducer.ts', import.meta.url), 'utf8');
  const from = reducer.indexOf("case 'APPLY_AI_GENERATED_DEFINITIONS':");
  const body = reducer.slice(from, reducer.indexOf("case 'UNLOCK_WORD_DEFINITIONS':", from));
  assert.match(body, /applyAIGeneratedDefinitions\(/);
  assert.doesNotMatch(body, /\.map\(/);
});
