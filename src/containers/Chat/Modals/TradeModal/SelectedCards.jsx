import PropTypes from 'prop-types';
import CardThumb from './CardThumb';

SelectedCards.propTypes = {
  selectedCards: PropTypes.array.isRequired,
  style: PropTypes.object
};
export default function SelectedCards({ selectedCards, style }) {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        ...style
      }}
    >
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        {selectedCards.map((card, index) => (
          <CardThumb
            key={card.id}
            card={card}
            style={{
              marginLeft: index > 0 ? '1rem' : 0
            }}
          />
        ))}
      </div>
    </div>
  );
}
