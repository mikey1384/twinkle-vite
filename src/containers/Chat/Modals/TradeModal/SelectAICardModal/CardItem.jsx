import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import {
  borderRadius,
  innerBorderRadius,
  Color,
  mobileMaxWidth
} from '~/constants/css';
import {
  cardLevelHash,
  cloudFrontURL,
  cardProps,
  qualityProps
} from '~/constants/defaultValues';
import { css } from '@emotion/css';

CardItem.propTypes = {
  card: PropTypes.object.isRequired
};

export default function CardItem({ card }) {
  const [mouseOver, setMouseOver] = useState(false);
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
      onMouseEnter={() => setMouseOver(true)}
      onMouseLeave={() => setMouseOver(false)}
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        padding: '1rem',
        border: `1px solid ${Color.borderGray()}`,
        borderRadius
      }}
      className={css`
        margin: 0.3%;
        width: 16%;
        @media (max-width: ${mobileMaxWidth}) {
          margin: 1%;
          width: 30%;
        }
      `}
    >
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
      {mouseOver ? (
        <div
          style={{
            borderRadius: innerBorderRadius,
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            height: '100%',
            width: '100%',
            background: 'rgba(0, 0, 0, 0.1)'
          }}
        >
          <div>
            <Button opacity={0.5} skeuomorphic>
              details
            </Button>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <Button opacity={0.8} skeuomorphic>
              select
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
