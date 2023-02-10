import { useMemo } from 'react';
import PropTypes from 'prop-types';
import OfferPanel from './OfferPanel';
import WantPanel from './WantPanel';

Trade.propTypes = {
  myId: PropTypes.number.isRequired,
  myUsername: PropTypes.string.isRequired,
  partner: PropTypes.object.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  wantCardIds: PropTypes.array,
  wantCoins: PropTypes.number,
  offerCardIds: PropTypes.array,
  offerCoins: PropTypes.number,
  fromId: PropTypes.number.isRequired
};

export default function Trade({
  myId,
  myUsername,
  partner,
  onSetAICardModalCardId,
  offerCardIds,
  offerCoins,
  wantCardIds,
  wantCoins,
  fromId
}) {
  const from = useMemo(() => {
    return fromId === myId ? { id: myId, username: myUsername } : partner;
  }, [fromId, myId, myUsername, partner]);

  return (
    <div
      style={{
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <OfferPanel
        from={from}
        myId={myId}
        offerCardIds={offerCardIds}
        offerCoins={offerCoins}
        onSetAICardModalCardId={onSetAICardModalCardId}
      />
      <div>in exchange for</div>
      <WantPanel
        wantCardIds={wantCardIds}
        wantCoins={wantCoins}
        onSetAICardModalCardId={onSetAICardModalCardId}
      />
    </div>
  );
}
