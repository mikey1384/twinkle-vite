import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

ProposeTradeButtons.propTypes = {
  style: PropTypes.object,
  onCloseTransaction: PropTypes.func.isRequired,
  withdrawing: PropTypes.bool
};

export default function ProposeTradeButtons({
  style,
  onCloseTransaction,
  withdrawing
}) {
  return (
    <div style={style}>
      <Button
        loading={withdrawing}
        onClick={onCloseTransaction}
        color="blue"
        filled
      >
        <Icon icon="check" />
        <span style={{ marginLeft: '0.7rem' }}>Got it</span>
      </Button>
    </div>
  );
}
