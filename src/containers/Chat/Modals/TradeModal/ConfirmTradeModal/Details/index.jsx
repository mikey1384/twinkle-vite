import { useMemo } from 'react';
import PropTypes from 'prop-types';
import OfferDetail from './OfferDetail';
import WantDetail from './WantDetail';

Details.propTypes = {
  isAICardModalShown: PropTypes.bool,
  selectedOption: PropTypes.string.isRequired,
  offeredCardIds: PropTypes.array.isRequired,
  wantedCardIds: PropTypes.array.isRequired,
  coinOffered: PropTypes.number.isRequired,
  coinWanted: PropTypes.number.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired
};

export default function Details({
  isAICardModalShown,
  selectedOption,
  offeredCardIds,
  wantedCardIds,
  coinOffered,
  coinWanted,
  onSetAICardModalCardId,
  partner
}) {
  const effectiveCoinOffered = useMemo(() => {
    if (selectedOption === 'want') {
      return Math.max(coinOffered - coinWanted, 0);
    }
    return coinOffered;
  }, [coinOffered, coinWanted, selectedOption]);

  const effectiveCoinWanted = useMemo(() => {
    if (selectedOption === 'want') {
      return Math.max(coinWanted - coinOffered, 0);
    }
    return coinWanted;
  }, [coinOffered, coinWanted, selectedOption]);

  return (
    <div>
      <OfferDetail
        isAICardModalShown={isAICardModalShown}
        selectedOption={selectedOption}
        cardIds={offeredCardIds}
        coins={effectiveCoinOffered}
        partner={partner}
        onSetAICardModalCardId={onSetAICardModalCardId}
      />
      {selectedOption === 'want' && (
        <WantDetail
          isAICardModalShown={isAICardModalShown}
          cardIds={wantedCardIds}
          coins={effectiveCoinWanted}
          partner={partner}
          onSetAICardModalCardId={onSetAICardModalCardId}
        />
      )}
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
