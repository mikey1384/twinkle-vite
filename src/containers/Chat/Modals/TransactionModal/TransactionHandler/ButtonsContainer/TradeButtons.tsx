import React, { useEffect, useMemo, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { useAppContext } from '~/contexts';

export default function TradeButtons({
  channelId,
  isDeclining,
  myId,
  onAcceptTrade,
  onCounterPropose,
  onWithdrawTransaction,
  transactionId
}: {
  channelId: number;
  isDeclining: boolean;
  myId: number;
  onAcceptTrade: () => any;
  onCounterPropose: (v: any) => any;
  onWithdrawTransaction: (v: any) => any;
  transactionId: number;
}) {
  const acceptTrade = useAppContext((v) => v.requestHelpers.acceptTrade);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [disableReasonObj, setDisableReasonObj] = useState<any>({});
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
      } have enough coins to proceed with this transaction`;
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
    if (disableReasonObj.reason === 'changed group ownership') {
      return `${responsiblePartyLabel} no longer ${
        imResponsible ? `own` : `owns`
      } one or more of the groups included in this proposal`;
    }
    if (disableReasonObj.reason === 'unauthorized') {
      return 'You are not authorized to accept this transaction';
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
          onClick={() => onWithdrawTransaction({ cancelReason: 'decline' })}
          loading={isDeclining}
          color="darkGray"
          filled
        >
          <Icon icon="xmark" />
          <span style={{ marginLeft: '0.7rem' }}>Decline</span>
        </Button>
        <Button
          onClick={onCounterPropose}
          style={{ marginLeft: '1rem' }}
          color="pink"
          filled
        >
          <Icon icon="sparkles" />
          <span style={{ marginLeft: '0.7rem' }}>Counter</span>
        </Button>
        <Button
          style={{ marginLeft: '1rem' }}
          loading={checking || accepting}
          disabled={isDisabled}
          onClick={() => setConfirmModalShown(true)}
          color="green"
          filled
        >
          <Icon icon="check" />
          <span style={{ marginLeft: '0.7rem' }}>Accept</span>
        </Button>
      </div>
      {confirmModalShown && (
        <ConfirmModal
          modalOverModal
          onHide={() => setConfirmModalShown(false)}
          title="Accept Trade"
          onConfirm={handleAcceptClick}
        />
      )}
    </div>
  );

  async function handleAcceptClick() {
    setAccepting(true);
    try {
      const { isDisabled, disableReason, responsibleParty } = await acceptTrade(
        { channelId, transactionId }
      );
      if (isDisabled) {
        setDisableReasonObj({
          reason: disableReason,
          responsibleParty
        });
        setIsDisabled(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      onAcceptTrade();
    }
  }
}
