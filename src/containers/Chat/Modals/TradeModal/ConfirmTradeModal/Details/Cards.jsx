import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import CardThumb from '../../CardThumb';
import { isMobile } from '~/helpers';
import ShowMoreCardsButton from '../../ShowMoreCardsButton';
import MoreAICardsModal from './MoreAICardsModal';
const deviceIsMobile = isMobile(navigator);

Cards.propTypes = {
  cards: PropTypes.array.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired
};

export default function Cards({ cards, onSetAICardModalCardId }) {
  const [moreAICardsModalShown, setMoreAICardsModalShown] = useState(false);
  const displayedCards = useMemo(() => {
    const numShown = deviceIsMobile ? 3 : 5;
    if (cards.length <= numShown) {
      return cards;
    }
    return cards.slice(0, numShown);
  }, [cards]);
  const numMore = useMemo(() => {
    return cards.length - displayedCards.length;
  }, [cards, displayedCards]);

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
          onHide={() => setMoreAICardsModalShown(false)}
        />
      )}
    </div>
  );
}
