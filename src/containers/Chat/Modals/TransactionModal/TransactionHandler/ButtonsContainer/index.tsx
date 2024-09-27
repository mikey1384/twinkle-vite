import React, { useMemo, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import TradeButtons from './TradeButtons';
import { useAppContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';
import ProposeTradeButtons from './ProposeTradeButtons';

export default function ButtonsContainer({
  channelId,
  isFromMe,
  isExpressionOfInterest,
  isShowOfferValid,
  isTradeOfferValid,
  myId,
  onAcceptTrade,
  onCounterPropose,
  onSetCancelReason,
  onSetPendingTransaction,
  onUpdateCurrentTransactionId,
  partner,
  transactionId,
  type
}: {
  onAcceptTrade: any;
  channelId: number;
  isFromMe: boolean;
  isExpressionOfInterest: boolean;
  isShowOfferValid: boolean;
  isTradeOfferValid: boolean;
  myId: number;
  onCounterPropose: (v: any) => any;
  onSetPendingTransaction: (v: any) => any;
  onSetCancelReason: (v: any) => any;
  onUpdateCurrentTransactionId: (v: any) => any;
  partner: any;
  transactionId: number;
  type: string;
}) {
  const [withdrawing, setWithdrawing] = useState(false);
  const closeTransaction = useAppContext(
    (v) => v.requestHelpers.closeTransaction
  );
  const withdrawIcon = useMemo(() => {
    if (type === 'trade' && !isExpressionOfInterest) {
      return 'redo';
    }
    return 'sparkles';
  }, [isExpressionOfInterest, type]);
  const withdrawColor = useMemo(() => {
    if (type === 'trade' && !isExpressionOfInterest) {
      return 'orange';
    }
    return 'blue';
  }, [isExpressionOfInterest, type]);
  const withdrawLabel = useMemo(() => {
    if (type === 'trade' && !isExpressionOfInterest) {
      return 'Withdraw Proposal';
    }
    return 'New Proposal';
  }, [isExpressionOfInterest, type]);

  return (
    <div>
      {isFromMe ? (
        <div style={{ marginTop: '0.5rem' }}>
          <Button
            loading={withdrawing}
            onClick={() => handleCloseTransaction({ cancelReason: 'withdraw' })}
            color={withdrawColor}
            filled
          >
            <Icon icon={withdrawIcon} />
            <span style={{ marginLeft: '0.7rem' }}>{withdrawLabel}</span>
          </Button>
        </div>
      ) : type === 'trade' && !isExpressionOfInterest ? (
        <TradeButtons
          myId={myId}
          isDeclining={withdrawing}
          channelId={channelId}
          onAcceptTrade={onAcceptTrade}
          onCounterPropose={onCounterPropose}
          onWithdrawTransaction={handleCloseTransaction}
          transactionId={transactionId}
        />
      ) : type === 'send' ? (
        <div>
          <div
            style={{ marginTop: '1rem', width: '100%', textAlign: 'center' }}
          >
            <Button
              loading={withdrawing}
              onClick={handleCloseTransaction}
              color="blue"
              filled
            >
              <Icon icon="check" />
              <span style={{ marginLeft: '0.7rem' }}>Got it</span>
            </Button>
          </div>
        </div>
      ) : (
        <ProposeTradeButtons
          style={{ marginTop: '0.5rem' }}
          type={type}
          isShowOfferValid={isShowOfferValid}
          isTradeOfferValid={isTradeOfferValid}
          withdrawing={withdrawing}
          onCounterPropose={onCounterPropose}
          onCloseTransaction={handleCloseTransaction}
          partner={partner}
        />
      )}
    </div>
  );

  async function handleCloseTransaction({
    cancelReason
  }: {
    cancelReason?: string;
  }) {
    try {
      setWithdrawing(true);
      await closeTransaction({
        channelId,
        transactionId,
        cancelReason
      });
    } catch (error) {
      console.error(error);
    } finally {
      if (cancelReason) {
        socket.emit('cancel_transaction', {
          channelId,
          transactionId,
          cancelReason
        });
      }
      if (type === 'trade' && !isExpressionOfInterest) {
        onSetCancelReason(cancelReason);
      } else {
        onSetPendingTransaction(null);
        onUpdateCurrentTransactionId({
          channelId,
          transactionId: null
        });
      }
      setWithdrawing(false);
      socket.emit('update_current_transaction_id', {
        senderId: myId,
        channelId,
        transactionId: null
      });
    }
  }
}
