import PropTypes from 'prop-types';
import TransactionDetails from '../../TransactionDetails';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

TransactionHandler.propTypes = {
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired,
  transactionDetails: PropTypes.object.isRequired
};

export default function TransactionHandler({
  onSetAICardModalCardId,
  partner,
  transactionDetails
}) {
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
      <div>
        <Button onClick={() => console.log('clicked')} color="orange" filled>
          <Icon icon="redo" />
          <span style={{ marginLeft: '0.7rem' }}>Withdraw Offer</span>
        </Button>
      </div>
    </div>
  );
}
