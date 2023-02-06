import { useMemo } from 'react';
import PropTypes from 'prop-types';
import CardItem from '../CardItem';
import { mobileMaxWidth } from '~/constants/css';
import { cardLevelHash } from '~/constants/defaultValues';
import { css } from '@emotion/css';

Selected.propTypes = {
  aiCardModalType: PropTypes.string,
  cardIds: PropTypes.array,
  cardObj: PropTypes.object,
  color: PropTypes.string,
  partnerId: PropTypes.number,
  quality: PropTypes.string,
  myId: PropTypes.number,
  onSetSelectedCardIds: PropTypes.func.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  successColor: PropTypes.string
};

export default function Selected({
  aiCardModalType,
  cardIds,
  cardObj,
  color,
  partnerId,
  quality,
  myId,
  onSetSelectedCardIds,
  onSetAICardModalCardId,
  successColor
}) {
  const appliedColor = color === 'blue' ? 'logoBlue' : color;
  const cards = cardIds
    .map((cardId) => cardObj[cardId])
    .filter((card) => {
      if (!card) return false;
      if (card.isBurned) return false;
      if (color && color !== 'any') {
        const cardDetailObj = cardLevelHash[card?.level];
        if (cardDetailObj.color !== appliedColor) return false;
      }
      if (quality && quality !== 'any') {
        if (card.quality !== quality) return false;
      }
      return aiCardModalType === 'want'
        ? card.ownerId === partnerId
        : card.ownerId === myId;
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
          ? 'There are no selected cards that match the filter criteria'
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
              onSetSelectedCardIds((prevIds) => [...prevIds, card.id])
            }
            onDeselect={() =>
              onSetSelectedCardIds((prevIds) =>
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
