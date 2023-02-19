import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';

TradeButtons.propTypes = {
  onWithdrawTransaction: PropTypes.func.isRequired,
  transactionId: PropTypes.number.isRequired
};

export default function TradeButtons({ onWithdrawTransaction, transactionId }) {
  const [checking, setChecking] = useState(false);
  const checkTransactionPossible = useAppContext(
    (v) => v.requestHelpers.checkTransactionPossible
  );
  useEffect(() => {
    init();
    async function init() {
      setChecking(true);
      const { disableReason, responsibleParty, isDisabled } =
        await checkTransactionPossible(transactionId);
      console.log(disableReason, responsibleParty, isDisabled);
      setChecking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          loading={checking}
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
