import { notifyBuildOwnershipChanged } from '~/helpers/buildOwnershipEvents';
import { AppOwnershipNotice } from '~/components/Build/TradeBuilds';
import React, { useEffect, useState, useMemo } from 'react';
import TransactionDetails from '../../../TransactionDetails';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { useChatContext } from '~/contexts';
import ButtonsContainer from './ButtonsContainer';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Card } from '~/types';

export default function TransactionHandler({
  currentTransactionId,
  isAICardModalShown,
  onAcceptTrade,
  onCounterPropose,
  onSetAICardModalCardId,
  onSetPendingTransaction,
  onRefreshTransaction,
  onSetGroupObjs,
  groupObjs,
  myId,
  partner,
  transactionDetails,
  channelId
}: {
  currentTransactionId: number;
  isAICardModalShown: boolean;
  onAcceptTrade: (v: any) => any;
  onCounterPropose: (v: any) => any;
  onSetAICardModalCardId: (v: any) => any;
  onSetPendingTransaction: (v: any) => any;
  onRefreshTransaction: (transaction: any) => void;
  onSetGroupObjs: (v: any) => any;
  groupObjs: any;
  myId: number;
  partner: any;
  transactionDetails: any;
  channelId: number;
}) {
  const onUpdateCurrentTransactionId = useChatContext(
    (v) => v.actions.onUpdateCurrentTransactionId
  );
  const [cancelReason, setCancelReason] = useState('');
  const cancelExplainText = useMemo(() => {
    switch (cancelReason) {
      case 'withdraw':
        return 'You withdrew the trade proposal.';
      case 'decline':
        return 'You have declined the transaction.';
      default:
        return '';
    }
  }, [cancelReason]);

  const isExpressionOfInterest = useMemo(() => {
    const noCoinsOffered = !transactionDetails?.offer.coins;
    const noCardsOffered = !transactionDetails?.offer.cards?.length;
    const noGroupsOffered = !transactionDetails?.offer.groups?.length;
    return (
      transactionDetails?.type === 'trade' &&
      noCoinsOffered &&
      noCardsOffered &&
      noGroupsOffered &&
      !transactionDetails?.offer.builds?.length
    );
  }, [transactionDetails?.offer, transactionDetails?.type]);

  const isFromMe = transactionDetails.from === myId;

  useEffect(() => {
    return () => {
      if (cancelReason) {
        onUpdateCurrentTransactionId({
          channelId,
          transactionId: null
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelReason, channelId]);

  const isShowOfferValid = useMemo(() => {
    const hasValidCardOffer = transactionDetails?.offer?.cards?.some(
      (card: Card) =>
        !card.isBurned && card.ownerId === transactionDetails?.from
    );

    const hasValidGroupOffer = transactionDetails?.offer?.groups?.length > 0;

    return (
      hasValidCardOffer ||
      hasValidGroupOffer ||
      transactionDetails?.offer?.builds?.some(
        (build: any) =>
          !build.unavailable &&
          Number(build.userId) === Number(transactionDetails.from)
      )
    );
  }, [transactionDetails]);

  const isTradeOfferValid = useMemo(() => {
    const hasValidCardOffer = transactionDetails?.want?.cards?.some(
      (card: Card) => !card.isBurned && card.ownerId === transactionDetails?.to
    );
    const hasValidGroupOffer = transactionDetails?.want?.groups?.length > 0;
    return (
      hasValidCardOffer ||
      hasValidGroupOffer ||
      transactionDetails?.want?.builds?.some(
        (build: any) =>
          !build.unavailable &&
          Number(build.userId) === Number(transactionDetails.to)
      )
    );
  }, [transactionDetails]);

  return (
    <ErrorBoundary componentPath="Chat/Modals/TransactionModal/TransactionHandler">
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {!cancelReason && transactionDetails && (
          <TransactionDetails
            isOnModal
            currentTransactionId={currentTransactionId}
            groupObjs={groupObjs}
            partner={partner}
            isAICardModalShown={isAICardModalShown}
            onSetGroupObjs={onSetGroupObjs}
            onSetAICardModalCardId={onSetAICardModalCardId}
            transaction={transactionDetails}
            style={{ marginTop: '-1rem', width: '100%' }}
          />
        )}
        {!cancelReason &&
          (transactionDetails?.offer?.builds?.length > 0 ||
            transactionDetails?.want?.builds?.length > 0) && (
            <AppOwnershipNotice />
          )}
        {!cancelReason && (
          <ButtonsContainer
            transaction={transactionDetails}
            groupObjs={groupObjs}
            onInspectCard={onSetAICardModalCardId}
            isAICardModalShown={isAICardModalShown}
            isFromMe={isFromMe}
            myId={myId}
            channelId={channelId}
            onAcceptTrade={() => {
              notifyBuildOwnershipChanged([
                ...(transactionDetails?.offer?.buildIds || []),
                ...(transactionDetails?.want?.buildIds || [])
              ]);
              onAcceptTrade(undefined);
            }}
            onSetCancelReason={setCancelReason}
            transactionId={transactionDetails.id}
            isExpressionOfInterest={isExpressionOfInterest}
            onCounterPropose={onCounterPropose}
            onSetPendingTransaction={onSetPendingTransaction}
            onRefreshTransaction={onRefreshTransaction}
            onUpdateCurrentTransactionId={onUpdateCurrentTransactionId}
            partner={partner}
            type={transactionDetails.type}
            isShowOfferValid={isShowOfferValid}
            isTradeOfferValid={isTradeOfferValid}
          />
        )}
        {cancelReason ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                fontSize: '1.7rem',
                height: '10rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: Color.darkerGray(),
                fontFamily: 'Roboto, sans-serif'
              }}
            >
              {cancelExplainText}
            </div>
            <Button
              style={{ marginTop: '1rem', marginBottom: '1rem' }}
              variant="solid"
              color="blue"
              onClick={() => {
                setCancelReason('');
                onSetPendingTransaction(null);
                onUpdateCurrentTransactionId({
                  channelId,
                  transactionId: null
                });
              }}
            >
              <Icon icon="sparkles" />
              <span style={{ marginLeft: '0.7rem' }}>New Proposal</span>
            </Button>
          </div>
        ) : null}
      </div>
    </ErrorBoundary>
  );
}
