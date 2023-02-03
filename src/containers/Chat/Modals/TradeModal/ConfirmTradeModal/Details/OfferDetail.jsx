import PropTypes from 'prop-types';

OfferDetail.propTypes = {
  cards: PropTypes.array.isRequired,
  coins: PropTypes.number.isRequired
};

export default function OfferDetail({ cards, coins }) {
  return (
    <div>
      <div>these are the details of the offer</div>
      <div>{cards.length} cards</div>
      <div>{coins} coins</div>
    </div>
  );
}
