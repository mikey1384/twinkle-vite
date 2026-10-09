import React, { useMemo, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import TradeButtons from './TradeButtons';
import { useAppContext } from '~/contexts';
import ProposeTradeButtons from './ProposeTradeButtons';

export default function ButtonsContainer({
  transaction,
  groupObjs,
  onInspectCard,
  isAICardModalShown,
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
  onRefreshTransaction,
  onUpdateCurrentTransactionId,
  partner,
  transactionId,
  type
}: {
  transaction: any;
  groupObjs: Record<number, any>;
  onInspectCard: (id: number) => void;
  isAICardModalShown: boolean;
  onAcceptTrade: any;
  channelId: number;
  isFromMe: boolean;
  isExpressionOfInterest: boolean;
  isShowOfferValid: boolean;
  isTradeOfferValid: boolean;
  myId: number;
  onCounterPropose: (v: any) => any;
  onSetPendingTransaction: (v: any) => any;
  onRefreshTransaction: (transaction: any) => void;
  onSetCancelReason: (v: any) => any;
  onUpdateCurrentTransactionId: (v: any) => any;
  partner: any;
  transactionId: number;
  type: string;
}) {
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState('');
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
      {error && (
        <p role="alert" style={{ color: '#a12235', fontSize: '1.3rem' }}>
          {error}
        </p>
      )}
      {isFromMe ? (
        <div style={{ marginTop: '0.5rem' }}>
          <Button
            loading={withdrawing}
            onClick={() => handleCloseTransaction({ cancelReason: 'withdraw' })}
            color={withdrawColor}
            variant="solid"
          >
            <Icon icon={withdrawIcon} />
            <span style={{ marginLeft: '0.7rem' }}>{withdrawLabel}</span>
          </Button>
        </div>
      ) : type === 'trade' && !isExpressionOfInterest ? (
        <TradeButtons
          transaction={transaction}
          partnerName={partner.username}
          groupObjs={groupObjs}
          onInspectCard={onInspectCard}
          isAICardModalShown={isAICardModalShown}
          onRefreshTransaction={onRefreshTransaction}
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
              variant="solid"
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
      setError('');
      const result = await closeTransaction({
        channelId,
        transactionId,
        cancelReason
      });
      const confirmedCancelReason = result.cancelReason;
      if (type === 'trade' && !isExpressionOfInterest) {
        onSetCancelReason(confirmedCancelReason);
      } else {
        onSetPendingTransaction(null);
        onUpdateCurrentTransactionId({
          channelId,
          transactionId: null
        });
      }
    } catch (error: any) {
      setError(
        error?.response?.data?.error ||
          'This offer could not be closed. Please try again.'
      );
    } finally {
      setWithdrawing(false);
    }
  }
}
