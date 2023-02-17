import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext, useChatContext } from '~/contexts';

ButtonsContainer.propTypes = {
  channelId: PropTypes.number.isRequired,
  isFromMe: PropTypes.bool,
  onSetCancelReason: PropTypes.func.isRequired,
  onSetPendingTransaction: PropTypes.func.isRequired,
  transactionId: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired
};

export default function ButtonsContainer({
  channelId,
  isFromMe,
  onSetCancelReason,
  onSetPendingTransaction,
  transactionId,
  type
}) {
  const [withdrawing, setWithdrawing] = useState(false);
  const cancelTransaction = useAppContext(
    (v) => v.requestHelpers.cancelTransaction
  );
  const onUpdateCurrentTransactionId = useChatContext(
    (v) => v.actions.onUpdateCurrentTransactionId
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
            onClick={handleWithdrawTransaction}
            color={withdrawColor}
            filled
          >
            <Icon icon={withdrawIcon} />
            <span style={{ marginLeft: '0.7rem' }}>{withdrawLabel}</span>
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex' }}>
          <Button onClick={() => console.log('clicked')} color="rose" filled>
            <Icon icon="xmark" />
            <span style={{ marginLeft: '0.7rem' }}>Decline</span>
          </Button>
          <Button
            style={{ marginLeft: '2rem' }}
            onClick={() => console.log('clicked')}
            color="green"
            filled
          >
            <Icon icon="check" />
            <span style={{ marginLeft: '0.7rem' }}>Accept</span>
          </Button>
        </div>
      )}
    </div>
  );

  async function handleWithdrawTransaction() {
    try {
      setWithdrawing(true);
      await cancelTransaction({
        channelId,
        transactionId,
        reason: 'withdraw'
      });
    } catch (error) {
      console.log(error);
    } finally {
      if (type === 'trade') {
        onSetCancelReason('withdraw');
        setWithdrawing(false);
      } else {
        onSetPendingTransaction(null);
      }
      onUpdateCurrentTransactionId({ channelId, transactionId: null });
    }
  }
}
