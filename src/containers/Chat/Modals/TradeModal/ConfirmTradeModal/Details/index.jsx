import PropTypes from 'prop-types';
import OfferDetail from './OfferDetail';
import WantDetail from './WantDetail';

Details.propTypes = {
  selectedOption: PropTypes.string.isRequired,
  cardsOffered: PropTypes.array.isRequired,
  coinOffered: PropTypes.number.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partnerName: PropTypes.string.isRequired
};

export default function Details({
  selectedOption,
  cardsOffered,
  coinOffered,
  onSetAICardModalCardId,
  partnerName
}) {
  return (
    <div>
      <OfferDetail
        selectedOption={selectedOption}
        cards={cardsOffered}
        coins={coinOffered}
        partnerName={partnerName}
        onSetAICardModalCardId={onSetAICardModalCardId}
      />
      {selectedOption === 'want' && <WantDetail />}
    </div>
  );
}
