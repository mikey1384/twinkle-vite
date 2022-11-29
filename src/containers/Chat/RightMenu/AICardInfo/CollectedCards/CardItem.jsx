import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import {
  cardLevelHash,
  cloudFrontURL,
  cardProps,
  qualityProps
} from '~/constants/defaultValues';

CardItem.propTypes = {
  index: PropTypes.number.isRequired,
  card: PropTypes.object.isRequired
};

export default function CardItem({ card, index }) {
  const cardObj = useMemo(() => cardLevelHash[card?.level], [card?.level]);
  const cardColor = useMemo(() => Color[cardObj?.color](), [cardObj?.color]);
  const borderColor = useMemo(() => qualityProps[card.quality].color, [card]);
  return (
    <div
      style={{
        height: '10rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderTop: index === 0 ? 0 : `1px solid ${Color.borderGray()}`
      }}
      key={card.id}
    >
      <div
        style={{
          marginLeft: '0.5rem',
          borderRadius: '3px',
          width: '5rem',
          height: '7rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: cardColor,
          border: cardProps[card.quality].includes('glowy')
            ? `3px solid ${borderColor}`
            : 'none'
        }}
      >
        <img
          style={{ width: '100%' }}
          src={`${cloudFrontURL}${card.imagePath}`}
        />
      </div>
      <div style={{ flexGrow: 1, marginLeft: '1rem' }}>
        <div
          style={{
            width: '100%',
            textAlign: 'center',
            fontSize: '1.3rem'
          }}
          className={css`
            font-size: 1.3rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.2rem;
            }
          `}
        >
          {`"${card.prompt}"`}
        </div>
      </div>
    </div>
  );
}
