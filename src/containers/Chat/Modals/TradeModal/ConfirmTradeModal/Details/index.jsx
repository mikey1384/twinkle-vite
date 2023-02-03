import PropTypes from 'prop-types';
import OfferDetail from './OfferDetail';
import WantDetail from './WantDetail';

Details.propTypes = {
  selectedOption: PropTypes.string.isRequired,
  cardsOffered: PropTypes.array.isRequired,
  coinOffered: PropTypes.number.isRequired,
  partnerName: PropTypes.string.isRequired
};

export default function Details({
  selectedOption,
  cardsOffered,
  coinOffered,
  partnerName
}) {
  return (
    <div>
      <OfferDetail
        selectedOption={selectedOption}
        cards={cardsOffered}
        coins={coinOffered}
        partnerName={partnerName}
      />
      {selectedOption === 'want' && <WantDetail />}
    </div>
  );
}
