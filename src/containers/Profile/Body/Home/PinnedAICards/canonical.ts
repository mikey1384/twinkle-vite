export function getCanonicalPinnedAICardIds(payload: unknown): number[] {
  const cardIds = (payload as { cardIds?: unknown } | null)?.cardIds;
  if (
    !Array.isArray(cardIds) ||
    cardIds.some((cardId) => !Number.isInteger(cardId) || cardId <= 0)
  ) {
    throw new Error('Pinned AI Cards response did not include canonical data');
  }
  return cardIds;
}

export function getCanonicalPinnedAICardsLoadPayload(payload: unknown) {
  const canonicalPayload = payload as {
    cardIds?: unknown;
    cards?: unknown;
    isTopCards?: unknown;
  } | null;
  const cardIds = getCanonicalPinnedAICardIds(payload);
  if (
    !Array.isArray(canonicalPayload?.cards) ||
    typeof canonicalPayload?.isTopCards !== 'boolean'
  ) {
    throw new Error(
      'Pinned AI Cards response did not include canonical display data'
    );
  }
  return {
    cardIds,
    cards: canonicalPayload.cards,
    isTopCards: canonicalPayload.isTopCards
  };
}
