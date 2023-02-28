import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Heading from './Heading';
import Body from './Body';
import OfferPanel from './OfferPanel';
import UsernameText from '~/components/Texts/UsernameText';

Send.propTypes = {
  cardIds: PropTypes.array,
  coins: PropTypes.number,
  fromId: PropTypes.number.isRequired,
  isAICardModalShown: PropTypes.bool,
  isOnModal: PropTypes.bool,
  isCurrent: PropTypes.bool,
  myId: PropTypes.number.isRequired,
  myUsername: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired,
  toId: PropTypes.number.isRequired
};

export default function Send({
  cardIds,
  coins,
  fromId,
  isAICardModalShown,
  isOnModal,
  isCurrent,
  myId,
  myUsername,
  onClick,
  onSetAICardModalCardId,
  partner,
  toId
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
        width: '100%'
      }}
    >
      <Heading isCurrent={isCurrent} color="green">
        <div>
          <UsernameText
            displayedName={from.id === myId ? 'You' : from.username}
            color="#fff"
            user={{
              id: from.id,
              username: from.username
            }}
          />{' '}
          sent{' '}
          <UsernameText
            displayedName={to.id === myId ? 'you' : to.username}
            color="#fff"
            user={{
              id: to.id,
              username: to.username
            }}
          />
        </div>
      </Heading>
      <Body onClick={onClick}>
        <OfferPanel
          isAICardModalShown={isAICardModalShown}
          isOnModal={isOnModal}
          offerCardIds={cardIds}
          offerCoins={coins}
          onSetAICardModalCardId={onSetAICardModalCardId}
          showCardDetailsOnThumbClick={!onClick}
        />
      </Body>
    </div>
  );
}
