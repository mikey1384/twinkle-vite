import React, { useMemo } from 'react';
import Heading from './Heading';
import Body from './Body';
import OfferPanel from './OfferPanel';
import UsernameText from '~/components/Texts/UsernameText';

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
  timeStamp,
  toId,
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
  timeStamp: number;
  toId: number;
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
      <Heading isCurrent={isCurrent} color="green" timeStamp={timeStamp}>
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
