import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Color, mobileMaxWidth } from '~/constants/css';
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
  const cardDetailObj = useMemo(
    () => cardLevelHash[card?.level],
    [card?.level]
  );
  const cardColor = useMemo(
    () => Color[card.isBurned ? 'black' : cardDetailObj?.color](),
    [card.isBurned, cardDetailObj?.color]
  );
  const borderColor = useMemo(
    () => qualityProps[card?.quality]?.color,
    [card?.quality]
  );

  return (
    <div
      className={css`
        width: 5rem;
        height: 7rem;
        border-radius: 3px;
        @media (max-width: ${mobileMaxWidth}) {
          width: 3.5rem;
          height: 5.5rem;
          border-radius: 2px;
        }
      `}
      style={{
        marginLeft: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: cardColor,
        border:
          cardProps[card.quality]?.includes('glowy') && !card.isBurned
            ? `3px solid ${borderColor}`
            : 'none'
      }}
    >
      {card.imagePath && !card.isBurned && (
        <img
          style={{ width: '100%' }}
          src={`${cloudFrontURL}${card.imagePath}`}
        />
      )}
    </div>
  );
}
