import PropTypes from 'prop-types';
import CardThumb from '../../CardThumb';

Cards.propTypes = {
  cards: PropTypes.array.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired
};

export default function Cards({ cards, onSetAICardModalCardId }) {
  return (
    <div style={{ display: 'flex' }}>
      {cards.map((card, index) => (
        <div key={card.id} style={{ position: 'relative' }}>
          <CardThumb
            card={card}
            style={{
              marginLeft: index > 0 ? '1rem' : 0
            }}
            onClick={() => onSetAICardModalCardId(card.id)}
          />
        </div>
      ))}
    </div>
  );
}
