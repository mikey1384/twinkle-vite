import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeAICardMysteryFilters } from '../src/helpers/aiCardSearchFilters';
import {
  aiCardSearchFiltersDiffer,
  findAICardFilterMismatches
} from '../src/containers/Explore/AICards/searchFilterUtils';

test('a complete mystery shared URL clears hidden facets and keeps public filters', () => {
  const filters = {
    isTotalMystery: 'true',
    isMystery: 'false',
    quality: 'legendary',
    style: 'watercolor',
    engine: 'image-2.5',
    owner: 'pilot',
    color: 'black',
    word: 'cloud',
    isBuyNow: true,
    minPrice: '100',
    maxPrice: '200'
  };
  assert.deepEqual(normalizeAICardMysteryFilters(filters), {
    isTotalMystery: true,
    isMystery: true,
    owner: 'pilot',
    color: 'black',
    word: 'cloud',
    isBuyNow: true,
    minPrice: '100',
    maxPrice: '200'
  });
  assert.equal(
    filters.quality,
    'legendary',
    'does not mutate the prior search'
  );
});

test('ordinary mystery searches retain visible quality and false URL flags stay off', () => {
  assert.deepEqual(
    normalizeAICardMysteryFilters({
      isMystery: true,
      isTotalMystery: 'false',
      quality: 'rare',
      engine: 'image-2.5'
    }),
    { isMystery: true, quality: 'rare' }
  );
  assert.deepEqual(
    normalizeAICardMysteryFilters({
      isMystery: 'false',
      isTotalMystery: false,
      quality: 'rare',
      engine: 'image-2.5'
    }),
    { quality: 'rare', engine: 'image-2.5' }
  );
});

test('switching between ordinary and complete mystery invalidates cached search results', () => {
  assert.equal(
    aiCardSearchFiltersDiffer(
      { isMystery: true },
      { isMystery: true, isTotalMystery: true }
    ),
    true
  );
});

test('complete mystery response checks reject visible artwork or quality', () => {
  const cards = [
    { id: 1, imagePath: '', quality: '???' },
    { id: 2, imagePath: '', quality: 'rare' },
    { id: 3, imagePath: '/revealed.png', quality: '???' }
  ];
  assert.deepEqual(
    findAICardFilterMismatches(cards, { isTotalMystery: true }).map(
      ({ cardId }) => cardId
    ),
    [2, 3]
  );
  assert.deepEqual(
    findAICardFilterMismatches(cards, { isMystery: true }).map(
      ({ cardId }) => cardId
    ),
    [3]
  );
});
