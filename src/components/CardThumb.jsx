import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  cardLevelHash,
  cloudFrontURL,
  cardProps,
  returnCardBurnXP,
  qualityProps
} from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';

CardThumb.propTypes = {
  card: PropTypes.object.isRequired
};

export default function CardThumb({ card }) {
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  const cardDetailObj = useMemo(
    () => cardLevelHash[card?.level],
    [card?.level]
  );
  const burnXP = useMemo(() => {
    if (!card) return 0;
    return returnCardBurnXP({
      cardLevel: card.level,
      cardQuality: card.quality
    });
  }, [card]);
  const displayedBurnXP = useMemo(() => {
    if (burnXP < 1000) return burnXP;
    if (burnXP < 1000000) return `${(burnXP / 1000).toFixed(1)}K`;
    return `${(burnXP / 1000000).toFixed(1)}M`;
  }, [burnXP]);
  const cardColor = useMemo(
    () => Color[card.isBurned ? 'black' : cardDetailObj?.color](),
    [card.isBurned, cardDetailObj?.color]
  );
  const borderColor = useMemo(() => qualityProps[card.quality]?.color, [card]);

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
