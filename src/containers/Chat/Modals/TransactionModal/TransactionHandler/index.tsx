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
    return (
      transactionDetails?.type === 'trade' && noCoinsOffered && noCardsOffered
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
    const validOfferedCards = transactionDetails?.offer?.cards?.filter(
      (card: Card) => {
        if (card.isBurned) {
          return false;
        }
        if (card.ownerId !== transactionDetails?.from) {
          return false;
        }
        return true;
      }
    );
    return validOfferedCards?.length > 0;
  }, [transactionDetails]);

  const isTradeOfferValid = useMemo(() => {
    const validOfferedCards = transactionDetails?.want?.cards?.filter(
      (card: Card) => {
        if (card.isBurned) {
          return false;
        }
        if (card.ownerId !== transactionDetails?.to) {
          return false;
        }
        return true;
      }
    );
    return validOfferedCards?.length > 0;
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
            partner={partner}
            isAICardModalShown={isAICardModalShown}
            onSetAICardModalCardId={onSetAICardModalCardId}
            transaction={transactionDetails}
            style={{ marginTop: '-1rem', width: '100%' }}
          />
        )}
        {!cancelReason && (
          <ButtonsContainer
            isFromMe={isFromMe}
            myId={myId}
            channelId={channelId}
            onAcceptTrade={onAcceptTrade}
            onSetCancelReason={setCancelReason}
            transactionId={transactionDetails.id}
            isExpressionOfInterest={isExpressionOfInterest}
            onCounterPropose={onCounterPropose}
            onSetPendingTransaction={onSetPendingTransaction}
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
              filled
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
