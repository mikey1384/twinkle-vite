import React from 'react';
import PropTypes from 'prop-types';
import { Color, mobileMaxWidth } from '~/constants/css';
import { cloudFrontURL, cardProps } from '~/constants/defaultValues';
import { css } from '@emotion/css';

Simple.propTypes = {
  card: PropTypes.object.isRequired,
  borderColor: PropTypes.string,
  cardColor: PropTypes.string,
  displayedBurnXP: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,
  xpNumberColor: PropTypes.string.isRequired
};
export default function Simple({
  card,
  borderColor,
  cardColor,
  displayedBurnXP,
  xpNumberColor
}: {
  card: any;
  borderColor?: string;
  cardColor?: string;
  displayedBurnXP: number | string;
  xpNumberColor: string;
}) {
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
      {!!card.isBurned && (
        <div
          className={css`
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0.5rem 0;
            font-size: 0.7rem;
          `}
        >
          <b style={{ color: Color[xpNumberColor]() }}>{displayedBurnXP}</b>
          <b style={{ color: Color.gold(), marginLeft: '2px' }}>XP</b>
        </div>
      )}
    </div>
  );
}
