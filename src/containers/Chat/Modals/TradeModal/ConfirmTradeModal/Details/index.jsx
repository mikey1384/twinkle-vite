import PropTypes from 'prop-types';
import OfferDetail from './OfferDetail';
import WantDetail from './WantDetail';

Details.propTypes = {
  selectedOption: PropTypes.string.isRequired
};

export default function Details({ selectedOption }) {
  return (
    <div>
      <OfferDetail />
      {selectedOption === 'want' && <WantDetail />}
    </div>
  );
}
