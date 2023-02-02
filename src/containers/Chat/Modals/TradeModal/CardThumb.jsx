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

CardThumb.propTypes = {
  card: PropTypes.object.isRequired
};

export default function CardThumb({ card }) {
  const cardDetailObj = useMemo(
    () => cardLevelHash[card?.level],
    [card?.level]
  );
  const cardColor = useMemo(
    () => Color[cardDetailObj?.color](),
    [cardDetailObj?.color]
  );
  const borderColor = useMemo(
    () => qualityProps[card?.quality]?.color,
    [card?.quality]
  );

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
      }}
    >
      <div style={{ fontFamily: "'Roboto', sans-serif" }}>#{card.id}</div>
      <div
        className={`inner ${css`
          width: 8rem;
          height: 12rem;
          border-radius: 3px;
          @media (max-width: ${mobileMaxWidth}) {
            width: 7rem;
            height: 11rem;
            border-radius: 2px;
          }
        `}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: cardColor,
          border:
            cardProps[card.quality]?.includes('glowy') && !card.isBurned
              ? `3px solid ${borderColor}`
              : 'none',
          position: 'relative'
        }}
      >
        {card.imagePath && !card.isBurned && (
          <img
            style={{ width: '100%' }}
            src={`${cloudFrontURL}${card.imagePath}`}
          />
        )}
      </div>
      {card.word ? (
        <div style={{ display: 'inline', marginTop: '0.5rem' }}>
          {' '}
          <b style={{ color: cardColor }}>{card.word}</b>
        </div>
      ) : null}
    </div>
  );
}
