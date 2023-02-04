import PropTypes from 'prop-types';
import OfferDetail from './OfferDetail';
import WantDetail from './WantDetail';

Details.propTypes = {
  isAICardModalShown: PropTypes.bool,
  selectedOption: PropTypes.string.isRequired,
  cardsOffered: PropTypes.array.isRequired,
  coinOffered: PropTypes.number.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partnerName: PropTypes.string.isRequired
};

export default function Details({
  isAICardModalShown,
  selectedOption,
  cardsOffered,
  coinOffered,
  onSetAICardModalCardId,
  partnerName
}) {
  return (
    <div>
      <OfferDetail
        isAICardModalShown={isAICardModalShown}
        selectedOption={selectedOption}
        cards={cardsOffered}
        coins={coinOffered}
        partnerName={partnerName}
        onSetAICardModalCardId={onSetAICardModalCardId}
      />
      {selectedOption === 'want' && <WantDetail />}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          marginTop: '1rem',
          padding: '1rem',
          fontWeight: 'bold'
        }}
      >
        Are you sure?
      </div>
    </div>
  );
}
