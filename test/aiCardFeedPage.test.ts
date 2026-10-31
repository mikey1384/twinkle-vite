import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hydrateAICardFeedPage,
  keepLoadedAICardFeeds
} from '../src/helpers/aiCardFeedPage';

test('a page of feed shells loads together before it is shown', async () => {
  const requested: number[] = [];
  const { cardFeeds, cardObj } = await hydrateAICardFeedPage({
    cardFeeds: [
      { id: 3, type: 'summon', description: 'newest' },
      { id: 2, type: 'offer' },
      { id: 1, type: 'transfer', isLoaded: true }
    ],
    cardObj: { 70: { id: 70, word: 'kept' } },
    loadFeed: async (feedId) => {
      requested.push(feedId);
      return { id: feedId, type: 'x', card: { id: feedId * 10 } };
    }
  });
  assert.deepEqual(requested.sort(), [2, 3]);
  assert.deepEqual(
    cardFeeds.map((feed) => [feed.id, feed.isLoaded]),
    [
      [3, true],
      [2, true],
      [1, true]
    ]
  );
  assert.deepEqual(Object.keys(cardObj).sort(), ['20', '30', '70']);
});

test('a feed that fails to load stays a shell for its own retry', async () => {
  const shell = { id: 5, type: 'summon' };
  const { cardFeeds, cardObj } = await hydrateAICardFeedPage({
    cardFeeds: [shell, { id: 4, type: 'offer' }],
    cardObj: {},
    loadFeed: async (feedId) => {
      if (feedId === 5) throw new Error('network');
      return { id: 4, type: 'offer', card: { id: 40 } };
    }
  });
  assert.equal(cardFeeds[0], shell);
  assert.equal(cardFeeds[1].isLoaded, true);
  assert.deepEqual(Object.keys(cardObj), ['40']);
});

test('a reconnect bootstrap keeps feeds already loaded in full', () => {
  const loaded = { id: 2, type: 'summon', isLoaded: true, description: 'full' };
  const feedObj = keepLoadedAICardFeeds(
    [{ id: 3, type: 'summon' }, { id: 2, type: 'summon' }],
    { 2: loaded, 9: { id: 9, isLoaded: true } }
  );
  assert.deepEqual(Object.keys(feedObj).sort(), ['2', '3']);
  assert.equal(feedObj[2], loaded);
  assert.deepEqual(feedObj[3], { id: 3, type: 'summon' });
});
