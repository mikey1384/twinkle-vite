import PropTypes from 'prop-types';
import OfferDetail from './OfferDetail';
import WantDetail from './WantDetail';

Details.propTypes = {
  selectedOption: PropTypes.string.isRequired,
  cardsOffered: PropTypes.array.isRequired,
  coinOffered: PropTypes.number.isRequired
};

export default function Details({ selectedOption, cardsOffered, coinOffered }) {
  return (
    <div>
      <OfferDetail cards={cardsOffered} coins={coinOffered} />
      {selectedOption === 'want' && <WantDetail />}
    </div>
  );
}
