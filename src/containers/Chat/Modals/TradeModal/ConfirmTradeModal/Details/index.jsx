import { useMemo } from 'react';
import PropTypes from 'prop-types';
import OfferDetail from './OfferDetail';
import WantDetail from './WantDetail';
import { useChatContext, useKeyContext } from '~/contexts';

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
  const { userId } = useKeyContext((v) => v.myState);
  const cardObj = useChatContext((v) => v.state.cardObj);
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

  const validOfferedCardIds = useMemo(() => {
    return offeredCardIds.filter(
      (cardId) =>
        cardObj[cardId] &&
        !cardObj[cardId].isBurned &&
        cardObj[cardId].ownerId === userId
    );
  }, [offeredCardIds, cardObj, userId]);

  const validWantedCardIds = useMemo(() => {
    return wantedCardIds.filter(
      (cardId) =>
        cardObj[cardId] &&
        !cardObj[cardId].isBurned &&
        cardObj[cardId].ownerId === partner.id
    );
  }, [wantedCardIds, cardObj, partner.id]);

  return (
    <div>
      {selectedOption === 'want' && (
        <WantDetail
          isAICardModalShown={isAICardModalShown}
          cardIds={validWantedCardIds}
          coins={effectiveCoinWanted}
          partner={partner}
          onSetAICardModalCardId={onSetAICardModalCardId}
        />
      )}
      <OfferDetail
        isAICardModalShown={isAICardModalShown}
        selectedOption={selectedOption}
        cardIds={validOfferedCardIds}
        coins={effectiveCoinOffered}
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
