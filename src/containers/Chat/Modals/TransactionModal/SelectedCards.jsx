import { useMemo } from 'react';
import PropTypes from 'prop-types';
import CardThumb from '~/components/CardThumb';
import CloseButton from '~/components/Buttons/CloseButton';
import { isMobile } from '~/helpers';
import { useChatContext, useKeyContext } from '~/contexts';
import ShowMoreCardsButton from '~/components/Buttons/ShowMoreCardsButton';

const deviceIsMobile = isMobile(navigator);

SelectedCards.propTypes = {
  selectedCardIds: PropTypes.array.isRequired,
  style: PropTypes.object,
  onDeselect: PropTypes.func.isRequired,
  onShowAICardSelector: PropTypes.func.isRequired,
  partnerId: PropTypes.number,
  type: PropTypes.string.isRequired
};

export default function SelectedCards({
  selectedCardIds,
  style,
  type,
  onDeselect,
  onShowAICardSelector,
  partnerId
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const validCardIds = useMemo(() => {
    return selectedCardIds.filter(
      (cardId) =>
        cardObj[cardId] &&
        !cardObj[cardId].isBurned &&
        (type === 'want'
          ? cardObj[cardId].ownerId === partnerId
          : cardObj[cardId].ownerId === userId)
    );
  }, [cardObj, partnerId, selectedCardIds, type, userId]);
  const displayedCardIds = useMemo(() => {
    const numShown = deviceIsMobile ? 3 : 5;
    if (validCardIds.length <= numShown) {
      return validCardIds;
    }
    return validCardIds.slice(0, numShown);
  }, [validCardIds]);

  const numMore = useMemo(() => {
    return validCardIds.length - displayedCardIds.length;
  }, [validCardIds, displayedCardIds]);

  const displayedCards = displayedCardIds
    .map((cardId) => cardObj[cardId])
    .filter(
      (card) =>
        !!card &&
        !card.isBurned &&
        (type === 'want' ? card.ownerId === partnerId : card.ownerId === userId)
    );

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        ...style
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        {displayedCards.map((card, index) => (
          <div key={card.id} style={{ position: 'relative' }}>
            <CloseButton
              style={{ top: '0.5rem' }}
              onClick={() => onDeselect(card.id)}
            />
            <CardThumb
              detailed
              card={card}
              style={{
                marginLeft: index > 0 ? '1rem' : 0
              }}
            />
          </div>
        ))}
        <ShowMoreCardsButton onClick={onShowAICardSelector} numMore={numMore} />
      </div>
    </div>
  );
}
