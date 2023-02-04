import { useMemo } from 'react';
import PropTypes from 'prop-types';
import CardThumb from './CardThumb';
import CloseButton from '~/components/Buttons/CloseButton';
import { isMobile } from '~/helpers';
import { useChatContext, useKeyContext } from '~/contexts';
import ShowMoreCardsButton from './ShowMoreCardsButton';

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
  const displayedCardIds = useMemo(() => {
    const numShown = deviceIsMobile ? 3 : 5;
    if (selectedCardIds.length <= numShown) {
      return selectedCardIds;
    }
    return selectedCardIds.slice(0, numShown);
  }, [selectedCardIds]);

  const numMore = useMemo(() => {
    return selectedCardIds.length - displayedCardIds.length;
  }, [selectedCardIds, displayedCardIds]);

  const displayedCards = displayedCardIds
    .map((cardId) => cardObj[cardId])
    .filter(
      (card) =>
        !!card &&
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
