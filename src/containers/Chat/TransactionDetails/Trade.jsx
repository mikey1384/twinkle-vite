import { useMemo } from 'react';
import PropTypes from 'prop-types';
import OfferPanel from './OfferPanel';
import WantPanel from './WantPanel';
import Heading from './Heading';
import UsernameText from '~/components/Texts/UsernameText';
import Body from './Body';
import { Color } from '~/constants/css';

Trade.propTypes = {
  isCurrent: PropTypes.bool,
  isCancelled: PropTypes.bool,
  cancelReason: PropTypes.string,
  myId: PropTypes.number.isRequired,
  myUsername: PropTypes.string.isRequired,
  partner: PropTypes.object.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  wantCardIds: PropTypes.array,
  wantCoins: PropTypes.number,
  offerCardIds: PropTypes.array,
  offerCoins: PropTypes.number,
  onClick: PropTypes.func,
  fromId: PropTypes.number.isRequired,
  toId: PropTypes.number.isRequired
};

export default function Trade({
  isCurrent,
  isCancelled,
  cancelReason,
  myId,
  toId,
  myUsername,
  partner,
  onSetAICardModalCardId,
  onClick,
  offerCardIds,
  offerCoins,
  wantCardIds,
  wantCoins,
  fromId
}) {
  const from = useMemo(() => {
    return fromId === myId ? { id: myId, username: myUsername } : partner;
  }, [fromId, myId, myUsername, partner]);
  const to = useMemo(() => {
    return toId === myId ? { id: myId, username: myUsername } : partner;
  }, [toId, myId, myUsername, partner]);

  const isTrade = useMemo(() => {
    return !!offerCardIds.length || !!offerCoins;
  }, [offerCardIds, offerCoins]);

  const cancelReasonText = useMemo(() => {
    if (cancelReason === 'withdraw') {
      return `${
        from.username === myUsername ? 'You' : from.username
      } withdrew the trade.`;
    }
    if (cancelReason === 'decline') {
      return `${
        to.username === myUsername ? 'You' : to.username
      } declined the trade.`;
    }
  }, [cancelReason, from.username, myUsername, to.username]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%'
      }}
    >
      <Heading isCurrent={isCurrent} color="logoBlue">
        <div>
          <UsernameText
            displayedName={from.id === myId ? 'You' : from.username}
            color="#fff"
            user={{
              id: from.id,
              username: from.username
            }}
          />{' '}
          {isTrade
            ? `proposed a trade`
            : !!wantCoins
            ? `want${from.id === myId ? '' : 's'}`
            : `${from.id === myId ? 'are' : 'is'} interested in`}
        </div>
      </Heading>
      <Body onClick={onClick}>
        {isTrade && (
          <OfferPanel
            isTrade
            offerCardIds={offerCardIds}
            offerCoins={offerCoins}
            onSetAICardModalCardId={onSetAICardModalCardId}
            showCardDetailsOnThumbClick={!onClick}
          />
        )}
        <WantPanel
          style={{ marginTop: isTrade ? '1rem' : 0 }}
          isTrade={isTrade}
          wantCardIds={wantCardIds}
          wantCoins={wantCoins}
          onSetAICardModalCardId={onSetAICardModalCardId}
          showCardDetailsOnThumbClick={!onClick}
        />
        {isCancelled && (
          <div
            style={{
              marginTop: '1.5rem',
              fontFamily: 'Roboto, sans-serif',
              color: Color.darkerGray()
            }}
          >
            {cancelReasonText}
          </div>
        )}
      </Body>
    </div>
  );
}
