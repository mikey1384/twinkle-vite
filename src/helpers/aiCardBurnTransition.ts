import type { Card } from '~/types';
import {
  getConfirmedAICardBurnState,
  normalizeAICardId
} from './aiCardCanonicalUpdates';

const AI_CARD_BURN_ANIMATION_MS = 2000;

type UpdateAICard = (args: {
  cardId: number;
  newState: Record<string, unknown>;
}) => void;

interface PendingBurnTransition {
  confirmedBurnCard: Card;
  onUpdateAICard: UpdateAICard;
}

// The successful HTTP response and socket broadcast normally arrive together.
// Keep one animation boundary per card and let either path replace its
// confirmed payload without restarting the transition.
const pendingBurnTransitions = new Map<number, PendingBurnTransition>();

export function queueCanonicalAICardBurnTransition({
  cardId,
  card,
  onUpdateAICard
}: {
  cardId: number;
  card?: Card | null;
  onUpdateAICard: UpdateAICard;
}) {
  if (
    !card ||
    normalizeAICardId(card.id) !== cardId ||
    Number(card.isBurned) !== 1
  ) {
    return false;
  }

  const pendingTransition = pendingBurnTransitions.get(cardId);
  if (pendingTransition) {
    pendingTransition.confirmedBurnCard = card;
    pendingTransition.onUpdateAICard = onUpdateAICard;
    return true;
  }

  pendingBurnTransitions.set(cardId, {
    confirmedBurnCard: card,
    onUpdateAICard
  });
  onUpdateAICard({ cardId, newState: { isBurning: true } });

  setTimeout(() => {
    finishCanonicalAICardBurnTransition(cardId);
  }, AI_CARD_BURN_ANIMATION_MS);

  return true;
}

function finishCanonicalAICardBurnTransition(cardId: number) {
  const pendingTransition = pendingBurnTransitions.get(cardId);
  if (!pendingTransition) return;
  pendingBurnTransitions.delete(cardId);

  // Burn responses disclose mystery fields, but they do not own image,
  // listing, or ownership state. Applying only burn-owned confirmed fields
  // makes this transition commute with a reveal or marketplace event that
  // finishes while the animation is running.
  pendingTransition.onUpdateAICard({
    cardId,
    newState: {
      ...getConfirmedAICardBurnState(pendingTransition.confirmedBurnCard),
      isBurning: false
    }
  });
}
