import React, { useEffect, useMemo, useState } from 'react';
import AICardsPreview from '~/components/AICardsPreview';
import AICardModal from '~/components/Modals/AICardModal';
import { useAppContext, useChatContext } from '~/contexts';

export default function MultiCardComponent({
  color,
  isBuyNow,
  quality,
  owner,
  word
}: {
  color?: string | null;
  isBuyNow?: string | null;
  quality?: string | null;
  owner?: string | null;
  word?: string | null;
}) {
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const [cardIds, setCardIds] = useState<number[]>([]);
  const loadFilteredAICards = useAppContext(
    (v) => v.requestHelpers.loadFilteredAICards
  );
  useEffect(() => {
    init();
    async function init() {
      const { cards } = await loadFilteredAICards({
        filters: {
          color,
          isBuyNow,
          quality,
          owner,
          word
        }
      });
      const cardIds = [];
      for (const card of cards) {
        onUpdateAICard({
          cardId: card.id,
          newState: card
        });
        cardIds.push(card.id);
      }
      setCardIds(cardIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, isBuyNow, owner, quality, word]);

  const title = useMemo(() => {
    const titleParts = [];
    if (owner) {
      titleParts.push(`${owner}'s`);
    }
    if (color) {
      titleParts.push(`${color} card${cardIds.length > 1 ? 's' : ''}`);
    } else {
      titleParts.push(`card${cardIds.length > 1 ? 's' : ''}`);
    }
    if (quality) {
      titleParts.push(`of ${quality} quality`);
    }
    if (word) {
      titleParts.push(`containing the word "${word}"`);
    }
    if (isBuyNow) {
      titleParts.push('you can buy now');
    }
    return titleParts.filter(Boolean).join(' ');
  }, [color, isBuyNow, owner, quality, word, cardIds]);

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        height: '18rem'
      }}
    >
      {title}
      <AICardsPreview
        isAICardModalShown={!!selectedCardId}
        cardIds={cardIds}
        moreAICardsModalTitle={title}
        onSetAICardModalCardId={setSelectedCardId}
      />
      {selectedCardId && (
        <AICardModal
          cardId={selectedCardId}
          onHide={() => setSelectedCardId(null)}
        />
      )}
    </div>
  );
}
