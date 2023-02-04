import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import CardThumb from '../../CardThumb';
import { isMobile } from '~/helpers';
import ShowMoreCardsButton from '../../ShowMoreCardsButton';
import MoreAICardsModal from './MoreAICardsModal';
import { useChatContext, useKeyContext } from '~/contexts';

const deviceIsMobile = isMobile(navigator);

Cards.propTypes = {
  isAICardModalShown: PropTypes.bool,
  cardIds: PropTypes.array.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partnerId: PropTypes.number,
  type: PropTypes.string.isRequired
};

export default function Cards({
  isAICardModalShown,
  cardIds,
  onSetAICardModalCardId,
  partnerId,
  type
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const validCardIds = useMemo(() => {
    return cardIds.filter(
      (cardId) =>
        cardObj[cardId] &&
        !cardObj[cardId].isBurned &&
        (type === 'want'
          ? cardObj[cardId].ownerId === partnerId
          : cardObj[cardId].ownerId === userId)
    );
  }, [cardIds, cardObj, partnerId, type, userId]);
  const [moreAICardsModalShown, setMoreAICardsModalShown] = useState(false);
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
  const cards = validCardIds.map((cardId) => cardObj[cardId]);
  const displayedCards = displayedCardIds.map((cardId) => cardObj[cardId]);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {displayedCards.map((card, index) => (
        <div key={card.id} style={{ position: 'relative' }}>
          <CardThumb
            card={card}
            style={{
              marginLeft: index > 0 ? '1rem' : 0
            }}
            onClick={() => onSetAICardModalCardId(card.id)}
          />
        </div>
      ))}
      {!!numMore && (
        <ShowMoreCardsButton
          onClick={() => setMoreAICardsModalShown(true)}
          numMore={numMore}
        />
      )}
      {moreAICardsModalShown && (
        <MoreAICardsModal
          cards={cards}
          onSetAICardModalCardId={onSetAICardModalCardId}
          onHide={() =>
            isAICardModalShown ? null : setMoreAICardsModalShown(false)
          }
        />
      )}
    </div>
  );
}
