import React, { useEffect, useState } from 'react';
import AICardsPreview from '~/components/AICardsPreview';
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
      <AICardsPreview isAICardModalShown={false} cardIds={cardIds} />
    </div>
  );
}
