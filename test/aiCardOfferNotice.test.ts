import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AI_CARD_OFFER_NOTICE_STATUS_CACHE_LIMIT,
  normalizeAICardOfferMessagePayload,
  updateAICardOfferNoticeStatusMap
} from '../src/helpers/aiCardOfferNotice';

test('offer notice payloads require a complete canonical identity and status', () => {
  assert.deepEqual(
    normalizeAICardOfferMessagePayload({
      offerId: '41',
      cardId: 12,
      price: 450,
      offererId: 7,
      ownerId: 8,
      status: 'open'
    }),
    {
      offerId: 41,
      cardId: 12,
      price: 450,
      offererId: 7,
      ownerId: 8,
      status: 'open'
    }
  );
  assert.equal(
    normalizeAICardOfferMessagePayload({
      offerId: 41,
      cardId: 12,
      price: 450,
      offererId: 7,
      ownerId: 8
    }),
    null
  );
  assert.equal(
    normalizeAICardOfferMessagePayload({
      offerId: 41,
      cardId: 12,
      price: -1,
      offererId: 7,
      ownerId: 8,
      status: 'open'
    }),
    null
  );
});

test('terminal socket state is bounded and cannot regress', () => {
  const accepted = updateAICardOfferNoticeStatusMap({
    offerId: 41,
    status: 'accepted'
  });
  assert.equal(accepted[41], 'accepted');
  const contradicted = updateAICardOfferNoticeStatusMap({
    current: accepted,
    offerId: 41,
    status: 'withdrawn'
  });
  assert.equal(contradicted[41], 'accepted');

  const full = Object.fromEntries(
    Array.from(
      { length: AI_CARD_OFFER_NOTICE_STATUS_CACHE_LIMIT },
      (_, index) => [index + 1, 'withdrawn']
    )
  );
  const bounded = updateAICardOfferNoticeStatusMap({
    current: full,
    offerId: 999,
    status: 'accepted'
  });
  assert.equal(
    Object.keys(bounded).length,
    AI_CARD_OFFER_NOTICE_STATUS_CACHE_LIMIT
  );
  assert.equal(bounded[999], 'accepted');
  assert.equal(bounded[1], undefined);
});
