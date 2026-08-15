import assert from 'node:assert/strict';
import test from 'node:test';

import { getAICardDisplayEngine } from '../src/helpers/aiCardDisplay';

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
