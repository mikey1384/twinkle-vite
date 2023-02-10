import PropTypes from 'prop-types';

TransactionMessage.propTypes = {
  transaction: PropTypes.object.isRequired
};

export default function TransactionMessage({ transaction }) {
  return (
    <div>
      <div>
        this is for transaction!!
        {(transaction?.id, transaction.offer.coins)}
      </div>
    </div>
  );
}
