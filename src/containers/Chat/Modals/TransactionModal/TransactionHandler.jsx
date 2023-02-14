import PropTypes from 'prop-types';
import TransactionDetails from '../../TransactionDetails';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

TransactionHandler.propTypes = {
  onSetAICardModalCardId: PropTypes.func.isRequired,
  myId: PropTypes.number.isRequired,
  partner: PropTypes.object.isRequired,
  transactionDetails: PropTypes.object.isRequired
};

export default function TransactionHandler({
  onSetAICardModalCardId,
  myId,
  partner,
  transactionDetails
}) {
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
      {isFromMe ? (
        <div>
          <Button onClick={() => console.log('clicked')} color="orange" filled>
            <Icon icon="redo" />
            <span style={{ marginLeft: '0.7rem' }}>Withdraw Proposal</span>
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
}
