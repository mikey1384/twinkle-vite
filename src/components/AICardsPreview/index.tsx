import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import CardThumb from '~/components/CardThumb';
import ShowMoreCardsButton from '~/components/Buttons/ShowMoreCardsButton';
import MoreAICardsModal from './MoreAICardsModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import { isMobile, isTablet } from '~/helpers';
import { useChatContext } from '~/contexts';

const deviceIsMobile = isMobile(navigator);
const deviceIsTablet = isTablet();

AICardsPreview.propTypes = {
  isAICardModalShown: PropTypes.bool.isRequired,
  isOnModal: PropTypes.bool,
  cardIds: PropTypes.array.isRequired,
  moreAICardsModalTitle: PropTypes.string,
  onSetAICardModalCardId: PropTypes.func
};
export default function AICardsPreview({
  isAICardModalShown,
  isOnModal,
  cardIds,
  moreAICardsModalTitle,
  onLoadMoreClick,
  onSetAICardModalCardId
}: {
  isAICardModalShown: boolean;
  isOnModal?: boolean;
  cardIds: number[];
  moreAICardsModalTitle?: string;
  onLoadMoreClick?: () => void;
  onSetAICardModalCardId?: (cardId: number) => void;
}) {
  const cardObj = useChatContext((v) => v.state.cardObj);
  const { numMore, cards, displayedCards } = useMemo(() => {
    const displayedCardIds = cardIds.slice(
      0,
      deviceIsMobile || deviceIsTablet ? 3 : 5
    );
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
                  : undefined
              }
            />
          </div>
        ))}
        {!!numMore && (
          <ShowMoreCardsButton
            onClick={
              onLoadMoreClick
                ? onLoadMoreClick
                : onSetAICardModalCardId
                ? () => setMoreAICardsModalShown(true)
                : undefined
            }
            hideNumMore={!!onLoadMoreClick}
            numMore={numMore}
          />
        )}
        {moreAICardsModalShown && (
          <MoreAICardsModal
            modalOverModal={isOnModal}
            cards={cards}
            moreAICardsModalTitle={moreAICardsModalTitle}
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
