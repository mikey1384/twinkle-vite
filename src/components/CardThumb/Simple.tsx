import React from 'react';
import Loading from '~/components/Loading';
import MysteryCardArt from '~/components/AICard/MysteryCardArt';
import useSizedImage from '~/helpers/hooks/useSizedImage';
import { Color, mobileMaxWidth } from '~/constants/css';
import { cloudFrontURL, cardProps } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import {
  isTotalMysteryQuality,
  totalMysteryBorderClass
} from '~/components/AICard/totalMysteryGlow';

export default function Simple({
  card,
  isLoading,
  borderColor,
  cardColor,
  displayedBurnXP,
  style,
  xpNumberColor = 'logoBlue'
}: {
  card: any;
  isLoading: boolean;
  borderColor?: string;
  cardColor?: string;
  displayedBurnXP: number | string;
  style?: React.CSSProperties;
  xpNumberColor: string;
}) {
  const isTotalMystery = isTotalMysteryQuality(card.quality) && !card.isBurned;
  // The thumb is a few dozen px wide: a small copy of the art, not the
  // 1024x1536 original (cropped to fill, so square art is the worst case).
  const sizedArt = useSizedImage({
    src:
      card.imagePath && !card.isBurned
        ? `${cloudFrontURL}${card.imagePath}`
        : '',
    fit: 'cover',
    aspect: 1
  });

  return isLoading ? (
    <Loading />
  ) : (
    <div
      className={`${css`
        width: 5rem;
        height: 7rem;
        border-radius: 3px;
        @media (max-width: ${mobileMaxWidth}) {
          width: 3.5rem;
          height: 5.5rem;
          border-radius: 2px;
        }
      `}${isTotalMystery ? ` ${totalMysteryBorderClass}` : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: cardColor,
        position: 'relative',
        border: isTotalMystery
          ? '3px solid transparent'
          : cardProps[card.quality]?.includes('glowy') && !card.isBurned
          ? `3px solid ${borderColor}`
          : 'none',
        ...style
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
          decoding="async"
          {...sizedArt}
        />
      ) : !card.isBurned ? (
        <MysteryCardArt level={card.level} style={{ height: '75%' }} />
      ) : null}
      {!!card.isBurned && (
        <div
          className={css`
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0.5rem 0;
            font-size: 1.1rem;
          `}
        >
          <b style={{ color: xpNumberColor }}>{displayedBurnXP}</b>
          <b style={{ color: Color.gold(), marginLeft: '2px' }}>XP</b>
        </div>
      )}
    </div>
  );
}
