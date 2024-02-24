import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import CardThumb from '~/components/CardThumb';
import ShowMoreCardsButton from '~/components/Buttons/ShowMoreCardsButton';
import MoreAICardsModal from './MoreAICardsModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useChatContext } from '~/contexts';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

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
  const { numMore, displayedCardIds, allCardIds } = useMemo(() => {
    const displayedCardIds = cardIds.slice(0, deviceIsMobile ? 3 : 5);
    const numMore = cardIds.length - displayedCardIds.length;
    const allCardIds = cardIds.map((cardId) => cardId);
    return { numMore, allCardIds, displayedCardIds };
  }, [cardIds]);
  const [moreAICardsModalShown, setMoreAICardsModalShown] = useState(false);

  return (
    <ErrorBoundary componentPath="components/AICardsPreview">
      <div style={{ display: 'flex', height: '100%' }}>
        {displayedCardIds.map((cardId, index) => {
          return (
            <div key={cardId} style={{ position: 'relative' }}>
              <CardThumb
                detailed
                card={cardObj[cardId] || { id: cardId }}
                style={{
                  marginLeft: index > 0 ? '1rem' : 0
                }}
                onClick={
                  onSetAICardModalCardId
                    ? () => onSetAICardModalCardId(cardId)
                    : undefined
                }
              />
            </div>
          );
        })}
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
            cards={allCardIds.map(
              (cardId) => cardObj[cardId] || { id: cardId }
            )}
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
