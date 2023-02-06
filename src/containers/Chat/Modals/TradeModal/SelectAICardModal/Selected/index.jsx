import PropTypes from 'prop-types';
import CardItem from '../CardItem';

Selected.propTypes = {
  aiCardModalType: PropTypes.string,
  cardIds: PropTypes.array,
  cardObj: PropTypes.object,
  partnerId: PropTypes.number,
  myId: PropTypes.number,
  onSetSelectedCardIds: PropTypes.func.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  successColor: PropTypes.string
};

export default function Selected({
  aiCardModalType,
  cardIds,
  cardObj,
  partnerId,
  myId,
  onSetSelectedCardIds,
  onSetAICardModalCardId,
  successColor
}) {
  const cards = cardIds
    .map((cardId) => cardObj[cardId])
    .filter(
      (card) =>
        !!card &&
        !card.isBurned &&
        (aiCardModalType === 'want'
          ? card.ownerId === partnerId
          : card.ownerId === myId)
    );

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
