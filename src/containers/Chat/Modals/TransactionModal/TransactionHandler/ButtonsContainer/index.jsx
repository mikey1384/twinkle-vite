import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import TradeButtons from './TradeButtons';
import { useAppContext } from '~/contexts';
import { socket } from '~/constants/io';

ButtonsContainer.propTypes = {
  channelId: PropTypes.number.isRequired,
  isFromMe: PropTypes.bool,
  isExpressionOfInterest: PropTypes.bool,
  myId: PropTypes.number.isRequired,
  onSetCancelReason: PropTypes.func.isRequired,
  onUpdateCurrentTransactionId: PropTypes.func.isRequired,
  transactionId: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired
};

export default function ButtonsContainer({
  channelId,
  isFromMe,
  isExpressionOfInterest,
  myId,
  onSetCancelReason,
  onUpdateCurrentTransactionId,
  transactionId,
  type
}) {
  const [withdrawing, setWithdrawing] = useState(false);
  const closeTransaction = useAppContext(
    (v) => v.requestHelpers.closeTransaction
  );
  const withdrawIcon = useMemo(() => {
    if (type === 'trade') {
      return 'redo';
    }
    return 'sparkles';
  }, [type]);
  const withdrawColor = useMemo(() => {
    if (type === 'trade') {
      return 'orange';
    }
    return 'blue';
  }, [type]);
  const withdrawLabel = useMemo(() => {
    if (type === 'trade') {
      return 'Withdraw Proposal';
    }
    return 'New Proposal';
  }, [type]);

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
          onWithdrawTransaction={handleCloseTransaction}
          transactionId={transactionId}
        />
      ) : (
        <div style={{ marginTop: '0.5rem' }}>
          <Button onClick={handleCloseTransaction} color="blue" filled>
            <Icon icon="check" />
            <span style={{ marginLeft: '0.7rem' }}>Got it</span>
          </Button>
        </div>
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
      if (type === 'trade') {
        onSetCancelReason(cancelReason);
      } else {
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
