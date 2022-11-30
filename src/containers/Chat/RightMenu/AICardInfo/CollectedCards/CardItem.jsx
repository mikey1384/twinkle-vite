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
  const borderColor = useMemo(() => qualityProps[card.quality]?.color, [card]);
  return (
    <div
      className={css`
        &:hover {
          background: ${Color.wellGray()};
        }
      `}
      style={{
        cursor: 'pointer',
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
          border: cardProps[card.quality]?.includes('glowy')
            ? `3px solid ${borderColor}`
            : 'none'
        }}
      >
        <img
          style={{ width: '100%' }}
          src={`${cloudFrontURL}${card.imagePath}`}
        />
      </div>
      <div
        style={{
          flexGrow: 1,
          marginLeft: '1rem',
          height: '100%',
          width: '17vw'
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          className={css`
            font-size: 1.3rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.2rem;
            }
          `}
        >
          <b>#{card.id}</b>
          <div
            style={{
              fontSize: '1.2rem',
              display: '-webkit-box',
              alignItems: 'center',
              justifyContent: 'center',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
              fontFamily: 'Roboto Mono, monospace',
              WebkitLineClamp: 1
            }}
          >
            {`"${card.prompt}"`}
          </div>
          <b
            style={{
              marginTop: '1rem',
              fontSize: '1.1rem',
              fontFamily: 'helvetica, sans-serif',
              color: Color.darkerGray()
            }}
          >
            {card.style}
          </b>
        </div>
      </div>
    </div>
  );
}
