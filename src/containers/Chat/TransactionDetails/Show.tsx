import React, { useMemo } from 'react';
import Heading from './Heading';
import Body from './Body';
import OfferPanel from './OfferPanel';
import UsernameText from '~/components/Texts/UsernameText';

export default function Show({
  cardIds,
  coins,
  isAICardModalShown,
  isCurrent,
  isOnModal,
  myId,
  myUsername,
  fromId,
  toId,
  onClick,
  onSetAICardModalCardId,
  partner,
  timeStamp,
  groupIds,
  groupObjs
}: {
  cardIds: number[];
  coins: number;
  fromId: number;
  isAICardModalShown: boolean;
  isOnModal?: boolean;
  isCurrent: boolean;
  myId: number;
  myUsername: string;
  onClick?: () => void;
  onSetAICardModalCardId: (cardId: number) => void;
  partner: { id: number; username: string };
  toId: number;
  timeStamp: number;
  groupIds: number[];
  groupObjs: Record<number, any>;
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
      <Heading isCurrent={isCurrent} color="pink" timeStamp={timeStamp}>
        {isCurrent ? (
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
        ) : (
          <div>
            <UsernameText
              displayedName={from.id === myId ? 'You' : from.username}
              color="#fff"
              user={{
                id: from.id,
                username: from.username
              }}
            />{' '}
            showed{' '}
            <UsernameText
              displayedName={to.id === myId ? 'you' : to.username}
              color="#fff"
              user={{
                id: to.id,
                username: to.username
              }}
            />
          </div>
        )}
      </Heading>
      <Body onClick={onClick}>
        <OfferPanel
          imOffering={from.id === myId}
          isAICardModalShown={isAICardModalShown}
          isOnModal={isOnModal}
          offerCardIds={cardIds}
          offerCoins={coins}
          offerGroupIds={groupIds}
          groupObjs={groupObjs}
          onSetAICardModalCardId={onSetAICardModalCardId}
          showCardDetailsOnThumbClick={!onClick}
        />
      </Body>
    </div>
  );
}
