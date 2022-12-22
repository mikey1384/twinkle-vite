import PropTypes from 'prop-types';
import LiveCard from './LiveCard';

AICard.propTypes = {
  animateOnMouseLeave: PropTypes.bool,
  card: PropTypes.object.isRequired,
  onClick: PropTypes.func
};

export default function AICard({ animateOnMouseLeave, card, onClick }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default'
      }}
      className={`unselectable`}
      onClick={onClick}
    >
      {card.isBurned ? (
        <div>burned</div>
      ) : (
        <LiveCard card={card} animateOnMouseLeave={animateOnMouseLeave} />
      )}
    </div>
  );
}
