import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';

TradeButtons.propTypes = {
  myId: PropTypes.number.isRequired,
  onWithdrawTransaction: PropTypes.func.isRequired,
  transactionId: PropTypes.number.isRequired
};

export default function TradeButtons({
  myId,
  onWithdrawTransaction,
  transactionId
}) {
  const [checking, setChecking] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [disableReasonObj, setDisableReasonObj] = useState({});
  const checkTransactionPossible = useAppContext(
    (v) => v.requestHelpers.checkTransactionPossible
  );
  useEffect(() => {
    init();
    async function init() {
      setChecking(true);
      const { disableReason, responsibleParty, isDisabled } =
        await checkTransactionPossible(transactionId);
      setIsDisabled(isDisabled);
      if (isDisabled) {
        setDisableReasonObj({
          reason: disableReason,
          responsibleParty
        });
      }
      setChecking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disabledReasonText = useMemo(() => {
    const imResponsible = disableReasonObj.responsibleParty?.id === myId;
    const responsiblePartyLabel = imResponsible
      ? 'You'
      : disableReasonObj.responsibleParty?.username;
    if (disableReasonObj.reason === 'not enough coins') {
      return `${responsiblePartyLabel} ${
        imResponsible ? `don't` : `doesn't`
      } have enough money to proceed with this transaction`;
    }
    if (disableReasonObj.reason === 'changed card ownership') {
      return `${responsiblePartyLabel} no longer ${
        imResponsible ? `own` : `owns`
      } one or more of the cards included in this proposal`;
    }
    if (disableReasonObj.reason === 'card burned') {
      return `${responsiblePartyLabel} ${
        imResponsible ? `burned` : `burned`
      } one or more of the cards included in this proposal`;
    }
    return '';
  }, [
    disableReasonObj.reason,
    disableReasonObj.responsibleParty?.id,
    disableReasonObj.responsibleParty?.username,
    myId
  ]);

  return (
    <div
      style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column' }}
    >
      {disabledReasonText && (
        <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
          {disabledReasonText}
        </div>
      )}
      <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
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
          disabled={isDisabled}
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
