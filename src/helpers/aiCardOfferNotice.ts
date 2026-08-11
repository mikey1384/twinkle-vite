export type AICardOfferNoticeStatus = 'open' | 'accepted' | 'withdrawn';
export type AICardOfferNoticeTerminalStatus = Exclude<
  AICardOfferNoticeStatus,
  'open'
>;

export interface AICardOfferMessagePayload {
  offerId: number;
  cardId: number;
  price: number;
  offererId: number;
  ownerId: number;
  status: AICardOfferNoticeStatus;
}

function positiveSafeInteger(value: unknown) {
  const normalized = Number(value);
  return Number.isSafeInteger(normalized) && normalized > 0 ? normalized : 0;
}

export function normalizeAICardOfferMessagePayload(
  value: unknown
): AICardOfferMessagePayload | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const payload = value as Record<string, unknown>;
  const offerId = positiveSafeInteger(payload.offerId);
  const cardId = positiveSafeInteger(payload.cardId);
  const price = positiveSafeInteger(payload.price);
  const offererId = positiveSafeInteger(payload.offererId);
  const ownerId = positiveSafeInteger(payload.ownerId);
  const status = payload.status;
  if (
    !offerId ||
    !cardId ||
    !price ||
    !offererId ||
    !ownerId ||
    (status !== 'open' && status !== 'accepted' && status !== 'withdrawn')
  ) {
    return null;
  }
  return { offerId, cardId, price, offererId, ownerId, status };
}

export const AI_CARD_OFFER_NOTICE_STATUS_CACHE_LIMIT = 500;

export function updateAICardOfferNoticeStatusMap({
  current,
  offerId,
  status
}: {
  current?: Record<number, AICardOfferNoticeTerminalStatus>;
  offerId: number;
  status: AICardOfferNoticeTerminalStatus;
}) {
  const normalizedOfferId = positiveSafeInteger(offerId);
  if (!normalizedOfferId) return current || {};
  // Accepted and withdrawn are both terminal canonical outcomes. The database
  // cannot move between them, so a delayed contradictory relay may not rewrite
  // whichever terminal outcome this delivery stream already confirmed.
  const next = {
    ...(current || {}),
    [normalizedOfferId]: current?.[normalizedOfferId] || status
  };
  const ids = Object.keys(next).map(Number);
  if (ids.length <= AI_CARD_OFFER_NOTICE_STATUS_CACHE_LIMIT) return next;
  // Offer ids are monotonic, so dropping the lowest other id bounds the global
  // marketplace relay cache while retaining the status event being applied.
  const oldestOtherId = ids.find((id) => id !== normalizedOfferId);
  if (oldestOtherId) delete next[oldestOtherId];
  return next;
}
