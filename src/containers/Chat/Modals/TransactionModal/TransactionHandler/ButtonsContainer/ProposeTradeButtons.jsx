import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

ProposeTradeButtons.propTypes = {
  style: PropTypes.object,
  onCounterPropose: PropTypes.func.isRequired,
  onCloseTransaction: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired,
  withdrawing: PropTypes.bool
};

export default function ProposeTradeButtons({
  style,
  onCounterPropose,
  onCloseTransaction,
  partner,
  withdrawing
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        ...style
      }}
    >
      <div style={{ marginTop: '1rem' }}>
        Do you want to see what {partner.username} owns?
      </div>
      <div
        style={{
          marginTop: '2.5rem',
          width: '100%',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Button
          loading={withdrawing}
          onClick={onCloseTransaction}
          color="darkGray"
          filled
        >
          <Icon icon="xmark" />
          <span style={{ marginLeft: '0.7rem' }}>No</span>
        </Button>
        <Button
          style={{ marginLeft: '1rem' }}
          onClick={onCounterPropose}
          color="green"
          filled
        >
          <Icon icon="check" />
          <span style={{ marginLeft: '0.7rem' }}>Yes, I want to see them</span>
        </Button>
      </div>
    </div>
  );
}
