import React, { useMemo } from 'react';
import CardItem from './CardItem';
import { mobileMaxWidth } from '~/constants/css';
import { cardLevelHash } from '~/constants/defaultValues';
import { css } from '@emotion/css';

export default function Selected({
  cardIds,
  cardObj,
  color,
  quality,
  onSetSelectedCardIds,
  onSetAICardModalCardId,
  successColor
}: {
  cardIds: number[];
  cardObj: { [key: number]: any };
  color: string;
  quality: string;
  onSetSelectedCardIds: (v: any) => any;
  onSetAICardModalCardId: (v: any) => any;
  successColor: string;
}) {
  const appliedColor = color === 'blue' ? 'logoBlue' : color;
  const cards = cardIds
    .map((cardId) => cardObj[cardId] || { id: cardId })
    .filter((card) => {
      if (!card.word) return true;
      if (card.isBurned) return false;
      if (color && color !== 'any') {
        const cardDetailObj = cardLevelHash[card?.level];
        if (cardDetailObj.color !== appliedColor) return false;
      }
      if (quality && quality !== 'any') {
        if (card.quality !== quality) return false;
      }
      return true;
    });

  const noCardsLabel = useMemo(() => {
    const filterApplied =
      (color && color !== 'any') || (quality && quality !== 'any');
    return (
      <div
        className={css`
          font-weight: bold;
          font-size: 1.7rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.5rem;
          }
        `}
      >
        {filterApplied
          ? 'None of the selected cards match the filter criteria'
          : `You haven't selected any cards`}
      </div>
    );
  }, [quality, color]);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
      {cards.length ? (
        cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            selected
            onSelect={() =>
              onSetSelectedCardIds((prevIds: number[]) => [...prevIds, card.id])
            }
            onDeselect={() =>
              onSetSelectedCardIds((prevIds: number[]) =>
                prevIds.filter((id) => id !== card.id)
              )
            }
            successColor={successColor}
            onSetAICardModalCardId={onSetAICardModalCardId}
          />
        ))
      ) : (
        <div
          style={{
            width: '100%',
            height: '20rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {noCardsLabel}
        </div>
      )}
    </div>
  );
}
