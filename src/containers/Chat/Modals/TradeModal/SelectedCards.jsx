import { useMemo } from 'react';
import PropTypes from 'prop-types';
import CardThumb from './CardThumb';
import CloseButton from '~/components/Buttons/CloseButton';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';

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
        <div
          style={{
            marginTop: '2.5rem',
            height: 'CALC(100% - 5rem)',
            minWidth: '9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            marginLeft: '2rem',
            borderRadius,
            cursor: 'pointer',
            border: `1px solid ${Color.borderGray()}`,
            fontWeight: 'bold',
            color: Color.black()
          }}
          className={css`
            font-size: 1.4rem;
            &:hover {
              background-color: ${Color.highlightGray()};
              font-size: 1.3rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.4rem;
              }
            }
          `}
          onClick={onShowAICardSelector}
        >
          {!!numMore ? `...${numMore} more` : '+ Add'}
        </div>
      </div>
    </div>
  );
}
