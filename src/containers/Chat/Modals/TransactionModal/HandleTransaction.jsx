import PropTypes from 'prop-types';

HandleTransaction.propTypes = {
  transaction: PropTypes.object.isRequired
};

export default function HandleTransaction({ transaction }) {
  return (
    <div>
      <div>Handle Transaction {transaction.id}</div>
    </div>
  );
}
