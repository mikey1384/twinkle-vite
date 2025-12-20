import React from 'react';
import Loading from '~/components/Loading';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { cloudFrontURL, cardProps } from '~/constants/defaultValues';
import { Card } from '~/types';

const thumbMystery = css`
  width: 100%;
  height: 75%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${Color.midnightBlack(0.96)};
`;

const thumbQuestion = css`
  font-size: 3.8rem;
  line-height: 1;
  font-weight: 800;
  color: ${Color.gold()};
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.6), 0 0 14px ${Color.gold(0.35)};
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 3rem;
  }
`;

export default function CardThumb({
  card,
  displayedBurnXP,
  isLoading,
  borderColor,
  cardColor,
  style,
  onClick,
  xpNumberColor = 'logoBlue'
}: {
  card: Card;
  displayedBurnXP: string | number;
  isLoading: boolean;
  borderColor?: string;
  cardColor?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  xpNumberColor: string;
}) {
  return isLoading ? (
    <Loading />
  ) : (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'inherit',
        ...style
      }}
      onClick={onClick}
    >
      <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: '1.3rem' }}>
        #{card.id}
      </div>
      <div
        className={css`
          width: 8rem;
          height: 12rem;
          border-radius: 3px;
          @media (max-width: ${mobileMaxWidth}) {
            width: 6rem;
            height: 9.5rem;
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
              : 'none',
          position: 'relative'
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
              font-size: 1.3rem;
            `}
          >
            <b style={{ color: xpNumberColor }}>{displayedBurnXP}</b>
            <b style={{ color: Color.gold(), marginLeft: '2px' }}>XP</b>
          </div>
        )}
      </div>
      {card?.word ? (
        <div
          className={css`
            width: 8rem;
            display: inline-block;
            margin-top: 0.5rem;
            text-align: center;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            line-height: 1.2;
            @media (max-width: ${mobileMaxWidth}) {
              width: 6rem;
            }
          `}
        >
          <b style={{ color: cardColor, fontSize: '1.3rem' }}>{card.word}</b>
        </div>
      ) : null}
    </div>
  );
}
