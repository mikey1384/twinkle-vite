import PropTypes from 'prop-types';
import OfferDetail from './OfferDetail';
import WantDetail from './WantDetail';

Details.propTypes = {
  coinsOffered: PropTypes.number.isRequired,
  coinsWanted: PropTypes.number.isRequired,
  cardIdsOffered: PropTypes.array.isRequired,
  cardIdsWanted: PropTypes.array.isRequired,
  isAICardModalShown: PropTypes.bool,
  selectedOption: PropTypes.string.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired
};

export default function Details({
  coinsOffered,
  coinsWanted,
  cardIdsOffered,
  cardIdsWanted,
  isAICardModalShown,
  selectedOption,
  onSetAICardModalCardId,
  partner
}) {
  return (
    <div>
      {selectedOption === 'want' && (
        <WantDetail
          isAICardModalShown={isAICardModalShown}
          cardIds={cardIdsWanted}
          coins={coinsWanted}
          partner={partner}
          onSetAICardModalCardId={onSetAICardModalCardId}
        />
      )}
      <OfferDetail
        isAICardModalShown={isAICardModalShown}
        selectedOption={selectedOption}
        cardIds={cardIdsOffered}
        coins={coinsOffered}
        partner={partner}
        onSetAICardModalCardId={onSetAICardModalCardId}
      />
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
