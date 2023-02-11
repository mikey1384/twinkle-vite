import { useMemo } from 'react';
import PropTypes from 'prop-types';
import OfferPanel from './OfferPanel';
import WantPanel from './WantPanel';
import Heading from './Heading';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

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
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        className={`unselectable ${css`
          width: 60%;
          cursor: pointer;
          &:hover {
            > .panel {
              background-color: #f5f5f5;
            }
          }
          @media (max-width: 768px) {
            width: ${mobileMaxWidth};
          }
        `}`}
      >
        {isTrade && (
          <OfferPanel
            offerCardIds={offerCardIds}
            offerCoins={offerCoins}
            onSetAICardModalCardId={onSetAICardModalCardId}
          />
        )}
        <WantPanel
          style={{ marginTop: '1rem' }}
          isTrade={isTrade}
          wantCardIds={wantCardIds}
          wantCoins={wantCoins}
          onSetAICardModalCardId={onSetAICardModalCardId}
        />
      </div>
    </div>
  );
}
