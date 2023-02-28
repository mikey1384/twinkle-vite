import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import CardThumb from '~/components/CardThumb';
import ShowMoreCardsButton from '~/components/Buttons/ShowMoreCardsButton';
import MoreAICardsModal from './MoreAICardsModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import { isMobile } from '~/helpers';
import { useChatContext } from '~/contexts';

const deviceIsMobile = isMobile(navigator);

AICardsPreview.propTypes = {
  isAICardModalShown: PropTypes.bool,
  cardIds: PropTypes.array.isRequired,
  onSetAICardModalCardId: PropTypes.func
};

export default function AICardsPreview({
  isAICardModalShown,
  cardIds,
  onSetAICardModalCardId
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
            modalOverModal
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
