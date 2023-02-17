import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import TransactionDetails from '../../../TransactionDetails';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import ButtonsContainer from './ButtonsContainer';

TransactionHandler.propTypes = {
  currentTransactionId: PropTypes.number,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  myId: PropTypes.number.isRequired,
  onSetPendingTransaction: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired,
  transactionDetails: PropTypes.object.isRequired,
  channelId: PropTypes.number.isRequired
};

export default function TransactionHandler({
  currentTransactionId,
  onSetAICardModalCardId,
  myId,
  onSetPendingTransaction,
  partner,
  transactionDetails,
  channelId
}) {
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
      {!cancelReason && (
        <TransactionDetails
          currentTransactionId={currentTransactionId}
          partner={partner}
          onSetAICardModalCardId={onSetAICardModalCardId}
          transaction={transactionDetails}
          style={{ marginTop: '-1rem', width: '100%' }}
        />
      )}
      {!cancelReason && (
        <ButtonsContainer
          isFromMe={isFromMe}
          channelId={channelId}
          onSetCancelReason={setCancelReason}
          onSetPendingTransaction={onSetPendingTransaction}
          transactionId={transactionDetails.id}
          type={transactionDetails.type}
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
            onClick={() => onSetPendingTransaction(null)}
          >
            <Icon icon="sparkles" />
            <span style={{ marginLeft: '0.7rem' }}>New Proposal</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
