import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import CardThumb from '../../containers/Chat/Modals/TradeModal/CardThumb';
import { isMobile } from '~/helpers';
import ShowMoreCardsButton from '~/components/ShowMoreCardsButton';
import MoreAICardsModal from './MoreAICardsModal';
import { useChatContext } from '~/contexts';

const deviceIsMobile = isMobile(navigator);

AICardsPreview.propTypes = {
  isAICardModalShown: PropTypes.bool,
  cardIds: PropTypes.array.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired
};

export default function AICardsPreview({
  isAICardModalShown,
  cardIds,
  onSetAICardModalCardId
}) {
  const cardObj = useChatContext((v) => v.state.cardObj);
  const [moreAICardsModalShown, setMoreAICardsModalShown] = useState(false);
  const displayedCardIds = useMemo(() => {
    const numShown = deviceIsMobile ? 3 : 5;
    if (cardIds.length <= numShown) {
      return cardIds;
    }
    return cardIds.slice(0, numShown);
  }, [cardIds]);
  const numMore = useMemo(() => {
    return cardIds.length - displayedCardIds.length;
  }, [cardIds, displayedCardIds]);
  const cards = cardIds.map((cardId) => cardObj[cardId]);
  const displayedCards = displayedCardIds
    .filter((cardId) => !!cardObj[cardId])
    .map((cardId) => cardObj[cardId]);

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
