import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getAICardDisplayEngine,
  getAICardDisplayPrompt,
  getAICardDisplayWord
} from '../src/helpers/aiCardDisplay';

test('mystery cards never expose a generation model', () => {
  assert.equal(
    getAICardDisplayEngine({
      imagePath: '',
      isMysteryCard: true,
      engine: 'DALL-E 2'
    }),
    ''
  );
  assert.equal(
    getAICardDisplayEngine({
      imagePath: '',
      isBurned: '0',
      engine: 'image-2'
    }),
    ''
  );
  assert.equal(
    getAICardDisplayEngine({
      imagePath: 'generating...',
      engine: 'image-2'
    }),
    ''
  );
});

test('revealed cards retain explicit and legacy model attribution', () => {
  assert.equal(
    getAICardDisplayEngine({
      imagePath: '/ai-arts/card.png',
      engine: 'image-2'
    }),
    'image-2'
  );
  assert.equal(
    getAICardDisplayEngine({ imagePath: '/ai-arts/legacy.png' }),
    'DALL-E 2'
  );
});

test('cached total mystery cards hide their word and sentence before canonical refresh', () => {
  const cached = {
    word: 'air',
    prompt: 'Fresh air filled the room.',
    imagePath: '',
    quality: '???',
    isBurned: '0'
  };
  assert.equal(getAICardDisplayWord(cached), '???');
  assert.equal(getAICardDisplayPrompt(cached), '???');
  assert.equal(
    cached.word,
    'air',
    'presentation does not rewrite canonical state'
  );
  for (const imagePath of ['', ' generating... ']) {
    const flagged = {
      ...cached,
      quality: 'rare',
      isTotalMystery: true,
      imagePath
    };
    assert.equal(getAICardDisplayWord(flagged), '???');
    assert.equal(getAICardDisplayPrompt(flagged), '???');
  }
});

test('ordinary mysteries and completed reveal or burn keep their canonical word', () => {
  const card = {
    word: 'air',
    prompt: 'Fresh air filled the room.',
    quality: 'rare',
    imagePath: '',
    isBurned: 0
  };
  for (const visible of [
    card,
    { ...card, isTotalMystery: 1, imagePath: '/revealed.png' },
    { ...card, isTotalMystery: 1, isBurned: '1' }
  ]) {
    assert.equal(getAICardDisplayWord(visible), 'air');
    assert.equal(getAICardDisplayPrompt(visible), card.prompt);
  }
});
