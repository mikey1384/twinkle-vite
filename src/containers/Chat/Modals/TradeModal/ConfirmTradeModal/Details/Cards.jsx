import PropTypes from 'prop-types';

Cards.propTypes = {
  cards: PropTypes.array.isRequired
};

export default function Cards({ cards }) {
  return (
    <div>
      <div>{cards.length}</div>
    </div>
  );
}
