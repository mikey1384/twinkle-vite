import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import TradeButtons from './TradeButtons';
import { useAppContext } from '~/contexts';
import { socket } from '~/constants/io';
import ProposeTradeButtons from './ProposeTradeButtons';

ButtonsContainer.propTypes = {
  onAcceptTrade: PropTypes.func.isRequired,
  channelId: PropTypes.number.isRequired,
  isFromMe: PropTypes.bool,
  isExpressionOfInterest: PropTypes.bool,
  myId: PropTypes.number.isRequired,
  onCounterPropose: PropTypes.func.isRequired,
  onSetPendingTransaction: PropTypes.func.isRequired,
  onSetCancelReason: PropTypes.func.isRequired,
  onUpdateCurrentTransactionId: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired,
  transactionId: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired
};

export default function ButtonsContainer({
  channelId,
  isFromMe,
  isExpressionOfInterest,
  myId,
  onAcceptTrade,
  onCounterPropose,
  onSetCancelReason,
  onSetPendingTransaction,
  onUpdateCurrentTransactionId,
  partner,
  transactionId,
  type
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
      ) : (
        <ProposeTradeButtons
          style={{ marginTop: '0.5rem' }}
          withdrawing={withdrawing}
          onCounterPropose={onCounterPropose}
          onCloseTransaction={handleCloseTransaction}
          partner={partner}
        />
      )}
    </div>
  );

  async function handleCloseTransaction({ cancelReason }) {
    try {
      setWithdrawing(true);
      await closeTransaction({
        channelId,
        transactionId,
        cancelReason
      });
    } catch (error) {
      console.log(error);
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
