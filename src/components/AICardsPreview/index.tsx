import React, { useMemo, useState } from 'react';
import CardThumb from '~/components/CardThumb';
import ShowMoreCardsButton from '~/components/Buttons/ShowMoreCardsButton';
import MoreAICardsModal from './MoreAICardsModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import { isMobile } from '~/helpers';
import { useChatContext } from '~/contexts';

const deviceIsMobile = isMobile(navigator);

export default function AICardsPreview({
  isAICardModalShown,
  isOnModal,
  cardIds,
  onSetAICardModalCardId
}: {
  isAICardModalShown: boolean;
  isOnModal: boolean;
  cardIds: number[];
  onSetAICardModalCardId?: (cardId: string) => void;
}) {
  const cardObj = useChatContext((v) => v.state.cardObj);
  const { numMore, cards, displayedCards } = useMemo(() => {
    const displayedCardIds = cardIds.slice(0, deviceIsMobile ? 3 : 5);
    const numMore = cardIds.length - displayedCardIds.length;
    const cards = cardIds.map((cardId) => cardObj[cardId]);
    const displayedCards = displayedCardIds
      .filter((cardId) => !!cardObj[cardId])
      .map((cardId) => cardObj[cardId]);
    return { numMore, cards, displayedCards };
  }, [cardIds, cardObj]);
  const [moreAICardsModalShown, setMoreAICardsModalShown] = useState(false);

  return (
    <ErrorBoundary componentPath="components/AICardsPreview">
      <div style={{ display: 'flex', height: '100%' }}>
        {displayedCards.map((card, index) => (
          <div key={card.id} style={{ position: 'relative' }}>
            <CardThumb
              detailed
              card={card}
              style={{
                marginLeft: index > 0 ? '1rem' : 0
              }}
              onClick={
                onSetAICardModalCardId
                  ? () => onSetAICardModalCardId(card.id)
                  : null
              }
            />
          </div>
        ))}
        {!!numMore && (
          <ShowMoreCardsButton
            onClick={
              onSetAICardModalCardId
                ? () => setMoreAICardsModalShown(true)
                : null
            }
            numMore={numMore}
          />
        )}
        {moreAICardsModalShown && (
          <MoreAICardsModal
            modalOverModal={isOnModal}
            cards={cards}
            onSetAICardModalCardId={onSetAICardModalCardId}
            onHide={() =>
              isAICardModalShown ? null : setMoreAICardsModalShown(false)
            }
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
