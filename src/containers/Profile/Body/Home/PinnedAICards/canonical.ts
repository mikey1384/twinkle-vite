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
