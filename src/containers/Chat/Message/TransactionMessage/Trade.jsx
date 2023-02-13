import { useMemo } from 'react';
import PropTypes from 'prop-types';
import OfferPanel from './OfferPanel';
import WantPanel from './WantPanel';
import Heading from './Heading';
import UsernameText from '~/components/Texts/UsernameText';
import Body from './Body';

Trade.propTypes = {
  myId: PropTypes.number.isRequired,
  myUsername: PropTypes.string.isRequired,
  partner: PropTypes.object.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  wantCardIds: PropTypes.array,
  wantCoins: PropTypes.number,
  offerCardIds: PropTypes.array,
  offerCoins: PropTypes.number,
  onSetTransactionModalShown: PropTypes.func.isRequired,
  fromId: PropTypes.number.isRequired
};

export default function Trade({
  myId,
  myUsername,
  partner,
  onSetAICardModalCardId,
  onSetTransactionModalShown,
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
        alignItems: 'center',
        width: '100%',
        paddingBottom: '1rem'
      }}
    >
      <Heading color="logoBlue">
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
            ? `want${from.id === myId ? '' : 's'} to trade`
            : !!wantCoins
            ? `want${from.id === myId ? '' : 's'}`
            : `${from.id === myId ? 'are' : 'is'} interested in`}
        </div>
      </Heading>
      <Body onSetTransactionModalShown={onSetTransactionModalShown}>
        {isTrade && (
          <OfferPanel
            isTrade
            offerCardIds={offerCardIds}
            offerCoins={offerCoins}
            onSetAICardModalCardId={onSetAICardModalCardId}
          />
        )}
        <WantPanel
          style={{ marginTop: isTrade ? '1rem' : 0 }}
          isTrade={isTrade}
          wantCardIds={wantCardIds}
          wantCoins={wantCoins}
          onSetAICardModalCardId={onSetAICardModalCardId}
        />
      </Body>
    </div>
  );
}
