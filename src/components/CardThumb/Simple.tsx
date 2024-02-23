import React from 'react';
import Loading from '~/components/Loading';
import { Color, mobileMaxWidth } from '~/constants/css';
import { cloudFrontURL, cardProps } from '~/constants/defaultValues';
import { css } from '@emotion/css';

export default function Simple({
  card,
  isLoading,
  borderColor,
  cardColor,
  displayedBurnXP,
  xpNumberColor
}: {
  card: any;
  isLoading: boolean;
  borderColor?: string;
  cardColor?: string;
  displayedBurnXP: number | string;
  xpNumberColor: string;
}) {
  return isLoading ? (
    <Loading />
  ) : (
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
