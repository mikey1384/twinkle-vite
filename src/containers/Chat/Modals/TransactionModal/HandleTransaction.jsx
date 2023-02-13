import PropTypes from 'prop-types';
import TransactionDetails from '../../TransactionDetails';

HandleTransaction.propTypes = {
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired,
  transactionDetails: PropTypes.object.isRequired
};

export default function HandleTransaction({
  onSetAICardModalCardId,
  partner,
  transactionDetails
}) {
  return (
    <div>
      <TransactionDetails
        partner={partner}
        onSetAICardModalCardId={onSetAICardModalCardId}
        transaction={transactionDetails}
      />
    </div>
  );
}
