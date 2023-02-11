import { useMemo } from 'react';
import PropTypes from 'prop-types';
import OfferPanel from './OfferPanel';
import WantPanel from './WantPanel';
import Heading from './Heading';

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
  const isTrade = useMemo(() => {
    return !!offerCardIds.length || !!offerCoins;
  }, [offerCardIds, offerCoins]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingBottom: '1rem'
      }}
    >
      <Heading
        isTrade={isTrade}
        from={from}
        myId={myId}
        isWantingCoin={!!wantCoins}
      />
      <div
        style={{
          padding: '1rem',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-around'
        }}
      >
        {isTrade && (
          <OfferPanel
            offerCardIds={offerCardIds}
            offerCoins={offerCoins}
            onSetAICardModalCardId={onSetAICardModalCardId}
          />
        )}
        <WantPanel
          isTrade={isTrade}
          wantCardIds={wantCardIds}
          wantCoins={wantCoins}
          onSetAICardModalCardId={onSetAICardModalCardId}
        />
      </div>
    </div>
  );
}
