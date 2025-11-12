import React from 'react';
import Loading from '~/components/Loading';
import { Color, mobileMaxWidth } from '~/constants/css';
import { cloudFrontURL, cardProps } from '~/constants/defaultValues';
import { css } from '@emotion/css';

const thumbMystery = css`
  width: 100%;
  height: 75%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${Color.midnightBlack(0.96)};
`;

const thumbQuestion = css`
  font-size: 2.6rem;
  line-height: 1;
  font-weight: 800;
  color: ${Color.gold()};
  text-shadow: 0 3px 10px rgba(0, 0, 0, 0.6), 0 0 12px ${Color.gold(0.35)};
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2rem;
  }
`;

export default function Simple({
  card,
  isLoading,
  borderColor,
  cardColor,
  displayedBurnXP,
  xpNumberColor = 'logoBlue'
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
        position: 'relative',
        border:
          cardProps[card.quality]?.includes('glowy') && !card.isBurned
            ? `3px solid ${borderColor}`
            : 'none'
      }}
    >
      {card.imagePath && !card.isBurned ? (
        <img
          style={{
            width: '100%',
            height: '75%',
            objectFit: 'cover'
          }}
          loading="lazy"
          src={`${cloudFrontURL}${card.imagePath}`}
        />
      ) : !card.isBurned ? (
        <div className={thumbMystery}>
          <span className={thumbQuestion}>?</span>
        </div>
      ) : null}
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
          <b style={{ color: xpNumberColor }}>{displayedBurnXP}</b>
          <b style={{ color: Color.gold(), marginLeft: '2px' }}>XP</b>
        </div>
      )}
    </div>
  );
}
