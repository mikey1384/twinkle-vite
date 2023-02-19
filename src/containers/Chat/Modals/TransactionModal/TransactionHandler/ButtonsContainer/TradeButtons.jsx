import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

TradeButtons.propTypes = {
  onWithdrawTransaction: PropTypes.func.isRequired
};

export default function TradeButtons({ onWithdrawTransaction }) {
  return (
    <div
      style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ display: 'flex' }}>
        <Button
          onClick={() => onWithdrawTransaction('decline')}
          color="rose"
          filled
        >
          <Icon icon="xmark" />
          <span style={{ marginLeft: '0.7rem' }}>Decline</span>
        </Button>
        <Button
          style={{ marginLeft: '1.5rem' }}
          onClick={() => console.log('clicked')}
          color="green"
          filled
        >
          <Icon icon="check" />
          <span style={{ marginLeft: '0.7rem' }}>Accept</span>
        </Button>
      </div>
    </div>
  );
}
