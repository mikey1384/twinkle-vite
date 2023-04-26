import React, { useMemo } from 'react';
import Heading from './Heading';
import Body from './Body';
import OfferPanel from './OfferPanel';
import UsernameText from '~/components/Texts/UsernameText';

interface Props {
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
}
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
}: Props) {
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
