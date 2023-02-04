import { useMemo } from 'react';
import PropTypes from 'prop-types';
import CardThumb from './CardThumb';
import CloseButton from '~/components/Buttons/CloseButton';
import { isMobile } from '~/helpers';
import ShowMoreCardsButton from './ShowMoreCardsButton';

const deviceIsMobile = isMobile(navigator);

SelectedCards.propTypes = {
  selectedCards: PropTypes.array.isRequired,
  style: PropTypes.object,
  onDeselect: PropTypes.func.isRequired,
  onShowAICardSelector: PropTypes.func.isRequired
};

export default function SelectedCards({
  selectedCards,
  style,
  onDeselect,
  onShowAICardSelector
}) {
  const displayedCards = useMemo(() => {
    const numShown = deviceIsMobile ? 3 : 5;
    if (selectedCards.length <= numShown) {
      return selectedCards;
    }
    return selectedCards.slice(0, numShown);
  }, [selectedCards]);

  const numMore = useMemo(() => {
    return selectedCards.length - displayedCards.length;
  }, [selectedCards, displayedCards]);

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
