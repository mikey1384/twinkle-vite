import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import TransactionDetails from '../../TransactionDetails';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';

TransactionHandler.propTypes = {
  onSetAICardModalCardId: PropTypes.func.isRequired,
  myId: PropTypes.number.isRequired,
  onSetPendingTransaction: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired,
  transactionDetails: PropTypes.object.isRequired,
  channelId: PropTypes.number.isRequired
};

export default function TransactionHandler({
  onSetAICardModalCardId,
  myId,
  onSetPendingTransaction,
  partner,
  transactionDetails,
  channelId
}) {
  const cancelTransaction = useAppContext(
    (v) => v.requestHelpers.cancelTransaction
  );
  const [withdrawing, setWithdrawing] = useState(false);
  const [cancelReason, setCancelReason] = useState(null);

  const cancelExplainText = useMemo(() => {
    switch (cancelReason) {
      case 'withdraw':
        return 'You withdrew the trade proposal.';
      case 'decline':
        return 'You have declined the transaction.';
      default:
        return null;
    }
  }, [cancelReason]);

  const isFromMe = transactionDetails.from === myId;
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <TransactionDetails
        partner={partner}
        onSetAICardModalCardId={onSetAICardModalCardId}
        transaction={transactionDetails}
        style={{ marginTop: '-1rem', width: '100%' }}
      />
      {!cancelReason && (
        <div>
          {isFromMe ? (
            <div>
              <Button
                loading={withdrawing}
                onClick={handleWithdrawTransaction}
                color="orange"
                filled
              >
                <Icon icon="redo" />
                <span style={{ marginLeft: '0.7rem' }}>Withdraw Proposal</span>
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex' }}>
              <Button
                onClick={() => console.log('clicked')}
                color="rose"
                filled
              >
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
      )}
      {cancelReason ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div style={{ padding: '2rem 0 1.5rem 0' }}>{cancelExplainText}</div>
          <Button
            style={{ marginTop: '1rem' }}
            filled
            color="logoBlue"
            onClick={() => onSetPendingTransaction(null)}
          >
            New Proposal
          </Button>
        </div>
      ) : null}
    </div>
  );

  async function handleWithdrawTransaction() {
    try {
      setWithdrawing(true);
      await cancelTransaction({
        channelId,
        transactionId: transactionDetails.id,
        reason: 'withdraw'
      });
    } catch (error) {
      console.log(error);
    } finally {
      setCancelReason('withdraw');
      setWithdrawing(false);
    }
  }
}
