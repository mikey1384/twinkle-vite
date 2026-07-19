const AI_CARD_DISCLOSURE_FIELDS = [
  'style',
  'quality',
  'prompt',
  'exampleText',
  'isMysteryCard',
  'isTotalMystery'
] as const;

const AI_CARD_IMAGE_FIELDS = [
  'imagePath',
  'engine',
  'isLive',
  'isImageGenerating'
] as const;

export const AI_CARD_DIRECT_TRANSFER_PAYLOAD_VERSION = 1;

export function normalizeAICardId(value: unknown) {
  const cardId = Number(value);
  return Number.isSafeInteger(cardId) && cardId > 0 ? cardId : null;
}

export function getConfirmedAICardBurnState(card: unknown) {
  return pickAICardFields(card, [
    ...AI_CARD_DISCLOSURE_FIELDS,
    'isBurned',
    'burnTimeStamp'
  ]);
}

export function getConfirmedAICardImageState(card: unknown) {
  return pickAICardFields(card, [
    ...AI_CARD_DISCLOSURE_FIELDS,
    ...AI_CARD_IMAGE_FIELDS
  ]);
}

export function getConfirmedAICardImageTerminalState({
  card,
  stage
}: {
  card: unknown;
  stage: 'completed' | 'error';
}) {
  const imageState = getConfirmedAICardImageState(card);
  if (typeof imageState.isImageGenerating !== 'boolean') return null;

  // The request/event confirms the terminal stage, while the canonical card
  // decides whether a newer generation is actually still running.
  const imageGenerationInProgress = imageState.isImageGenerating;
  return {
    ...imageState,
    imageGenerationStage: stage,
    imageGenerationInProgress,
    isImageGenerating: imageGenerationInProgress,
    imageGenerationPreviewUrl: ''
  };
}

export function getConfirmedAICardListingState(card: unknown) {
  return pickAICardFields(card, ['isListed', 'askPrice']);
}

export function getConfirmedAICardTransferState(card: unknown) {
  return pickAICardFields(card, [
    'ownerId',
    'owner',
    'isListed',
    'askPrice'
  ]);
}

export function getConfirmedAICardDirectTransferState({
  aiCardPayloadVersion,
  card,
  ownerId
}: {
  aiCardPayloadVersion?: number;
  card: unknown;
  ownerId: number;
}) {
  // Pre-version servers loaded transfer cards from a replica immediately
  // after writing. Their event target and transfer delisting are confirmed,
  // but the embedded card can still contain the previous owner/listing/reveal.
  const hasCanonicalCardPayload =
    aiCardPayloadVersion === AI_CARD_DIRECT_TRANSFER_PAYLOAD_VERSION;
  const transferState = getConfirmedAICardTransferState(card);
  const canonicalOwner = transferState.owner;
  const canonicalOwnerId = hasCanonicalCardPayload
    ? normalizeAICardId(transferState.ownerId)
    : null;
  const fallbackOwnerId = normalizeAICardId(ownerId);
  const resolvedOwnerId = canonicalOwnerId || fallbackOwnerId || ownerId;
  const canonicalOwnerObjectId = normalizeAICardId(
    canonicalOwner && typeof canonicalOwner === 'object'
      ? (canonicalOwner as Record<string, unknown>).id
      : undefined
  );
  const hasCanonicalListingState = Object.prototype.hasOwnProperty.call(
    transferState,
    'isListed'
  );
  const hasCanonicalAskPrice = Object.prototype.hasOwnProperty.call(
    transferState,
    'askPrice'
  );

  return {
    ...(hasCanonicalCardPayload
      ? getConfirmedAICardImageState(card)
      : {}),
    ownerId: resolvedOwnerId,
    owner:
      hasCanonicalCardPayload &&
      canonicalOwnerObjectId === resolvedOwnerId
        ? canonicalOwner
        : null,
    isListed:
      hasCanonicalCardPayload && hasCanonicalListingState
        ? transferState.isListed
        : false,
    askPrice:
      hasCanonicalCardPayload && hasCanonicalAskPrice
        ? transferState.askPrice
        : null
  };
}

function pickAICardFields(
  card: unknown,
  fields: readonly string[]
): Record<string, unknown> {
  if (!card || typeof card !== 'object' || Array.isArray(card)) return {};

  const cardRecord = card as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(cardRecord, field)) {
      result[field] = cardRecord[field];
    }
  }
  return result;
}
