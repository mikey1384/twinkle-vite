import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import {
  cardLevelHash,
  returnCardBurnXP,
  qualityProps
} from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import Simple from './Simple';
import Detailed from './Detailed';

CardThumb.propTypes = {
  card: PropTypes.object.isRequired,
  detailed: PropTypes.bool,
  style: PropTypes.object,
  onClick: PropTypes.func
};

export default function CardThumb({ card, detailed, style, onClick }) {
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  const { displayedBurnXP, cardColor, borderColor } = useMemo(() => {
    const cardDetailObj = cardLevelHash[card?.level];
    const burnXP = returnCardBurnXP({
      cardLevel: card?.level,
      cardQuality: card?.quality
    });
    const displayedBurnXP =
      burnXP < 1000
        ? burnXP
        : burnXP < 1000000
        ? `${(burnXP / 1000).toFixed(1)}K`
        : `${(burnXP / 1000000).toFixed(1)}M`;
    const cardColor =
      Color[card?.isBurned ? 'black' : cardDetailObj?.color]?.();
    const borderColor = qualityProps[card?.quality]?.color;
    return {
      displayedBurnXP,
      cardColor,
      borderColor
    };
  }, [card?.level, card?.quality, card?.isBurned]);

  return detailed ? (
    <Detailed
      card={card}
      cardColor={cardColor}
      borderColor={borderColor}
      displayedBurnXP={displayedBurnXP}
      xpNumberColor={xpNumberColor}
      style={style}
      onClick={onClick}
    />
  ) : (
    <Simple
      card={card}
      cardColor={cardColor}
      borderColor={borderColor}
      displayedBurnXP={displayedBurnXP}
      xpNumberColor={xpNumberColor}
    />
  );
}
