import React, { useEffect, useMemo, useState } from 'react';
import { Color } from '~/constants/css';
import {
  cardLevelHash,
  returnCardBurnXP,
  qualityProps
} from '~/constants/defaultValues';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import Simple from './Simple';
import Detailed from './Detailed';
import { Card } from '~/types';

export default function CardThumb({
  card,
  detailed,
  style,
  onClick
}: {
  card: Card;
  detailed?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  const cardObj = useChatContext((v) => v.state.cardObj);
  const loadAICard = useAppContext((v) => v.requestHelpers.loadAICard);
  const xpNumberColor = useKeyContext((v) => v.theme.xpNumber.color);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const [loading, setLoading] = useState(false);
  const cardState = cardObj[card.id];

  useEffect(() => {
    if (!card?.quality && !cardState?.quality) {
      initCard();
    }
    async function initCard() {
      setLoading(true);
      try {
        const { card: loadedCard } = await loadAICard(card.id);
        onUpdateAICard({
          cardId: card.id,
          newState: loadedCard
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, cardState?.word]);

  const finalCard = useMemo(
    () => ({
      ...card,
      ...cardState
    }),
    [card, cardState]
  );

  const { displayedBurnXP, cardColor, borderColor } = useMemo(() => {
    const cardDetailObj = cardLevelHash[finalCard?.level];
    const burnXP = returnCardBurnXP({
      cardLevel: finalCard?.level,
      cardQuality: finalCard?.quality
    });
    const displayedBurnXP =
      burnXP < 1000
        ? burnXP
        : burnXP < 1000000
        ? `${burnXP % 1000 === 0 ? burnXP / 1000 : (burnXP / 1000).toFixed(1)}K`
        : `${
            burnXP % 1000000 === 0
              ? burnXP / 1000000
              : (burnXP / 1000000).toFixed(1)
          }M`;
    const cardColor =
      Color[finalCard?.isBurned ? 'black' : cardDetailObj?.color]?.();
    const borderColor = qualityProps[finalCard?.quality]?.color;
    return {
      displayedBurnXP,
      cardColor,
      borderColor
    };
  }, [finalCard?.level, finalCard?.quality, finalCard?.isBurned]);

  return detailed ? (
    <Detailed
      isLoading={loading}
      card={finalCard}
      cardColor={cardColor}
      borderColor={borderColor}
      displayedBurnXP={displayedBurnXP}
      xpNumberColor={xpNumberColor}
      style={style}
      onClick={onClick}
    />
  ) : (
    <Simple
      isLoading={loading}
      card={finalCard}
      cardColor={cardColor}
      borderColor={borderColor}
      displayedBurnXP={displayedBurnXP}
      xpNumberColor={xpNumberColor}
    />
  );
}
