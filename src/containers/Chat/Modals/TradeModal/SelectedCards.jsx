import PropTypes from 'prop-types';
import CardThumb from './CardThumb';
import CloseButton from '~/components/Buttons/CloseButton';

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
          <div key={card.id} style={{ position: 'relative' }}>
            <CloseButton
              style={{ top: '0.5rem' }}
              onClick={() => console.log('close')}
            />
            <CardThumb
              card={card}
              style={{
                marginLeft: index > 0 ? '1rem' : 0
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
