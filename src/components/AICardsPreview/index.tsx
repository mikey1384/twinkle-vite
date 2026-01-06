import React, { useMemo, useState } from 'react';
import CardThumb from '~/components/CardThumb';
import ShowMoreCardsButton from '~/components/Buttons/ShowMoreCardsButton';
import MoreAICardsModal from './MoreAICardsModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useChatContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

export default function AICardsPreview({
  isAICardModalShown,
  isOnModal,
  cardIds,
  exploreUrl,
  moreAICardsModalTitle,
  onLoadMoreClick,
  onSetAICardModalCardId,
  themeColor
}: {
  isAICardModalShown: boolean;
  isOnModal?: boolean;
  cardIds: number[];
  exploreUrl?: string;
  moreAICardsModalTitle?: string;
  onLoadMoreClick?: () => void;
  onSetAICardModalCardId?: (cardId: number) => void;
  themeColor?: string;
}) {
  const navigate = useNavigate();
  const cardObj = useChatContext((v) => v.state.cardObj);
  const { numMore, displayedCardIds, allCardIds } = useMemo(() => {
    const displayedCardIds = cardIds.slice(0, deviceIsMobile ? 3 : 5);
    const numMore = cardIds.length - displayedCardIds.length;
    const allCardIds = cardIds.map((cardId) => cardId);
    return { numMore, allCardIds, displayedCardIds };
  }, [cardIds]);
  const [moreAICardsModalShown, setMoreAICardsModalShown] = useState(false);

  function handleShowMoreClick() {
    if (onLoadMoreClick) {
      onLoadMoreClick();
    } else if (numMore > 0 && onSetAICardModalCardId) {
      setMoreAICardsModalShown(true);
    } else if (exploreUrl) {
      navigate(exploreUrl);
    }
  }

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
        {(!!numMore || exploreUrl) && (
          <ShowMoreCardsButton
            onClick={handleShowMoreClick}
            hideNumMore={!!onLoadMoreClick || !numMore}
            numMore={numMore}
          />
        )}
        {moreAICardsModalShown && (
          <MoreAICardsModal
            modalOverModal={isOnModal}
            cards={allCardIds.map(
              (cardId) => cardObj[cardId] || { id: cardId }
            )}
            exploreUrl={exploreUrl}
            moreAICardsModalTitle={moreAICardsModalTitle}
            onSetAICardModalCardId={onSetAICardModalCardId}
            onHide={() =>
              isAICardModalShown ? null : setMoreAICardsModalShown(false)
            }
            themeColor={themeColor}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
