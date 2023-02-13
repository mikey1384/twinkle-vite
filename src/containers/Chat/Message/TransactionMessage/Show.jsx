import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Heading from './Heading';
import Body from './Body';
import OfferPanel from './OfferPanel';
import UsernameText from '~/components/Texts/UsernameText';

Show.propTypes = {
  cardIds: PropTypes.array,
  coins: PropTypes.number,
  fromId: PropTypes.number.isRequired,
  toId: PropTypes.number.isRequired,
  myId: PropTypes.number.isRequired,
  myUsername: PropTypes.string.isRequired,
  onSetTransactionModalShown: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired
};

export default function Show({
  cardIds,
  coins,
  myId,
  myUsername,
  fromId,
  toId,
  onSetTransactionModalShown,
  partner
}) {
  const from = useMemo(() => {
    return fromId === myId ? { id: myId, username: myUsername } : partner;
  }, [fromId, myId, myUsername, partner]);
  const to = useMemo(() => {
    return toId === myId ? { id: myId, username: myUsername } : partner;
  }, [toId, myId, myUsername, partner]);

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
      <Heading color="pink">
        <div>
          <UsernameText
            displayedName={from.id === myId ? 'You' : from.username}
            color="#fff"
            user={{
              id: from.id,
              username: from.username
            }}
          />{' '}
          {from.id === myId ? 'think' : 'thinks'}{' '}
          <UsernameText
            displayedName={to.id === myId ? 'you' : to.username}
            color="#fff"
            user={{
              id: to.id,
              username: to.username
            }}
          />{' '}
          might be interested in
        </div>
      </Heading>
      <Body onSetTransactionModalShown={onSetTransactionModalShown}>
        <OfferPanel offerCardIds={cardIds} offerCoins={coins} />
      </Body>
    </div>
  );
}
