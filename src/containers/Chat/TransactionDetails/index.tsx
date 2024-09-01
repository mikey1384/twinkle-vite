import React, { useEffect, useState } from 'react';
import Trade from './Trade';
import Show from './Show';
import Send from './Send';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useChatContext, useKeyContext } from '~/contexts';

export default function TransactionDetails({
  currentTransactionId,
  onClick,
  isAICardModalShown,
  isOnModal,
  onSetAICardModalCardId,
  transaction,
  partner,
  style
}: {
  currentTransactionId: number;
  onClick?: () => void;
  isAICardModalShown: boolean;
  isOnModal?: boolean;
  onSetAICardModalCardId: (cardId: number) => void;
  transaction: any;
  partner: any;
  style?: React.CSSProperties;
}) {
  const { userId, username } = useKeyContext((v) => v.myState);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const acceptedTransactions = useChatContext(
    (v) => v.state.acceptedTransactions
  );
  const cancelledTransactions = useChatContext(
    (v) => v.state.cancelledTransactions
  );
  const isAccepted =
    acceptedTransactions[transaction.id] || !!transaction.isAccepted;
  const isCancelled =
    !!cancelledTransactions[transaction.id] || !!transaction.isCancelled;
  const cancelReason =
    cancelledTransactions[transaction.id] || transaction.cancelReason;
  const { type, want = {}, offer = {} } = transaction;
  const {
    cards: wantCards = [],
    coins: wantCoins = 0,
    groups: wantGroups = []
  } = want || {};
  const {
    cards: offerCards = [],
    coins: offerCoins = 0,
    groups: offerGroups = []
  } = offer || {};
  const wantCardIds = wantCards.map((card: { id: number }) => card.id);
  const offerCardIds = offerCards.map((card: { id: number }) => card.id);
  const wantGroupIds = wantGroups.map((group: { id: number }) => group.id);
  const offerGroupIds = offerGroups.map((group: { id: number }) => group.id);

  const [groupObjs, setGroupObjs] = useState({});

  useEffect(() => {
    if (wantCards.length) {
      for (const card of wantCards) {
        onUpdateAICard({ cardId: card.id, newState: card, isInit: true });
      }
    }
    if (offerCards.length) {
      for (const card of offerCards) {
        onUpdateAICard({ cardId: card.id, newState: card, isInit: true });
      }
    }
    if (wantGroups?.length || offerGroups?.length) {
      const newGroupObjs = [
        ...(wantGroups || []),
        ...(offerGroups || [])
      ].reduce((acc: any, group: any) => {
        acc[group.id] = group;
        return acc;
      }, {});
      setGroupObjs(newGroupObjs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    offerCards?.length,
    wantCards?.length,
    offerGroups?.length,
    wantGroups?.length
  ]);

  return (
    <ErrorBoundary componentPath="Chat/TransactionDetails">
      <div style={style}>
        {type === 'trade' && (
          <Trade
            isCurrent={transaction.id === currentTransactionId}
            isAccepted={isAccepted}
            isCancelled={isCancelled}
            isOnModal={isOnModal}
            isAICardModalShown={isAICardModalShown}
            cancelReason={cancelReason}
            myId={userId}
            myUsername={username}
            wantCardIds={wantCardIds}
            wantCoins={wantCoins}
            offerCardIds={offerCardIds}
            offerCoins={offerCoins}
            partner={partner}
            onClick={onClick}
            onSetAICardModalCardId={onSetAICardModalCardId}
            timeStamp={transaction.timeStamp}
            fromId={transaction.from}
            toId={transaction.to}
            wantGroupIds={wantGroupIds}
            offerGroupIds={offerGroupIds}
            groupObjs={groupObjs}
          />
        )}
        {type === 'show' && (
          <Show
            isCurrent={transaction.id === currentTransactionId}
            isOnModal={isOnModal}
            isAICardModalShown={isAICardModalShown}
            myId={userId}
            myUsername={username}
            partner={partner}
            cardIds={offerCardIds}
            coins={offerCoins}
            fromId={transaction.from}
            onClick={onClick}
            onSetAICardModalCardId={onSetAICardModalCardId}
            timeStamp={transaction.timeStamp}
            toId={transaction.to}
            groupIds={offerGroupIds}
            groupObjs={groupObjs}
          />
        )}
        {type === 'send' && (
          <Send
            isAICardModalShown={isAICardModalShown}
            isCurrent={transaction.id === currentTransactionId}
            isOnModal={isOnModal}
            myId={userId}
            fromId={transaction.from}
            myUsername={username}
            partner={partner}
            cardIds={offerCardIds}
            coins={offerCoins}
            onClick={onClick}
            onSetAICardModalCardId={onSetAICardModalCardId}
            timeStamp={transaction.timeStamp}
            toId={transaction.to}
            groupIds={offerGroupIds}
            groupObjs={groupObjs}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
