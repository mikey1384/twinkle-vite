import PropTypes from 'prop-types';
import CardItem from '../CardItem';
import { cardLevelHash } from '~/constants/defaultValues';

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

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
      {cards.map((card) => (
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
      ))}
    </div>
  );
}
