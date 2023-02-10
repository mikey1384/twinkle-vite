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
  const cardDetailObj = useMemo(
    () => cardLevelHash[card?.level],
    [card?.level]
  );
  const burnXP = useMemo(() => {
    return returnCardBurnXP({
      cardLevel: card?.level,
      cardQuality: card?.quality
    });
  }, [card?.level, card?.quality]);
  const displayedBurnXP = useMemo(() => {
    if (burnXP < 1000) return burnXP;
    if (burnXP < 1000000) return `${(burnXP / 1000).toFixed(1)}K`;
    return `${(burnXP / 1000000).toFixed(1)}M`;
  }, [burnXP]);
  const cardColor = useMemo(
    () => Color[card.isBurned ? 'black' : cardDetailObj?.color](),
    [card.isBurned, cardDetailObj?.color]
  );
  const borderColor = useMemo(
    () => qualityProps[card?.quality]?.color,
    [card?.quality]
  );

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
