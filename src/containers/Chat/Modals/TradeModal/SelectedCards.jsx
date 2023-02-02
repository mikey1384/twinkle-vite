import PropTypes from 'prop-types';
import CardThumb from './CardThumb';

SelectedCards.propTypes = {
  selectedCards: PropTypes.array.isRequired,
  style: PropTypes.object
};
export default function SelectedCards({ selectedCards, style }) {
  return (
    <div style={{ width: '100%', ...style }}>
      <div style={{ width: '100%', display: 'flex' }}>
        {selectedCards.map((card) => (
          <CardThumb key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
