import React, { useEffect, useMemo, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ReviewModal from '../../../../Trade/ReviewModal';
import {
  getViewerTradeTerms,
  tradeTermsKey
} from '../../../../Trade/helpers/terms';
import { errorClass } from '../../../../Trade/styles';
import { useAppContext } from '~/contexts';
import { applyCanonicalCoinsAndReconcile } from '~/helpers/canonicalUserCoins';

export default function TradeButtons({
  channelId,
  isDeclining,
  myId,
  onAcceptTrade,
  onCounterPropose,
  onWithdrawTransaction,
  transactionId,
  transaction,
  partnerName,
  groupObjs,
  onInspectCard,
  isAICardModalShown,
  onRefreshTransaction
}: {
  channelId: number;
  isDeclining: boolean;
  myId: number;
  onAcceptTrade: () => any;
  onCounterPropose: (v: any) => any;
  onWithdrawTransaction: (v: any) => any;
  transactionId: number;
  transaction: any;
  partnerName: string;
  groupObjs: Record<number, any>;
  onInspectCard: (id: number) => void;
  isAICardModalShown: boolean;
  onRefreshTransaction: (transaction: any) => void;
}) {
  const acceptTrade = useAppContext((v) => v.requestHelpers.acceptTrade);
  const loadCoins = useAppContext((v) => v.requestHelpers.loadCoins);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const [reviewSnapshot, setReviewSnapshot] = useState<any>(null);
  const loadPendingTransaction = useAppContext(
    (v) => v.requestHelpers.loadPendingTransaction
  );
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');
  const [checking, setChecking] = useState(true);
  const [isDisabled, setIsDisabled] = useState(true);
  const [disableReasonObj, setDisableReasonObj] = useState<any>({});
  const checkTransactionPossible = useAppContext(
    (v) => v.requestHelpers.checkTransactionPossible
  );
  useEffect(() => {
    let cancelled = false;
    setReviewSnapshot(null);
    setChecking(true);
    setIsDisabled(true);
    setDisableReasonObj({});
    void checkTransactionPossible(transactionId)
      .then(({ disableReason, responsibleParty, isDisabled }: any) => {
        if (cancelled) return;
        setIsDisabled(isDisabled);
        setDisableReasonObj(
          isDisabled ? { reason: disableReason, responsibleParty } : {}
        );
      })
      .catch(() => {
        if (!cancelled)
          setAcceptError(
            'This offer could not be checked. Close and reopen it before accepting.'
          );
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

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
    if (disableReasonObj.reason === 'changed app ownership')
      return 'An app in this proposal is no longer available from its owner. Start a new proposal.';
    if (disableReasonObj.reason === 'changed group ownership') {
      return `${responsiblePartyLabel} no longer ${
        imResponsible ? `own` : `owns`
      } one or more of the groups included in this proposal`;
    }
    if (disableReasonObj.reason === 'unauthorized') {
      return 'You are not authorized to accept this transaction';
    }
    if (disableReasonObj.reason === 'classes not allowed') {
      return 'Classes are not allowed to be traded';
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
      {acceptError && (
        <p role="alert" className={errorClass}>
          {acceptError}
        </p>
      )}
      {disabledReasonText && (
        <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
          {disabledReasonText}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          width: '100%',
          justifyContent: 'center'
        }}
      >
        <Button
          onClick={() => onWithdrawTransaction({ cancelReason: 'decline' })}
          loading={isDeclining}
          color="darkGray"
          variant="solid"
        >
          <Icon icon="xmark" />
          <span style={{ marginLeft: '0.7rem' }}>Decline</span>
        </Button>
        <Button
          onClick={onCounterPropose}
          disabled={accepting}
          color="pink"
          variant="solid"
        >
          <Icon icon="sparkles" />
          <span style={{ marginLeft: '0.7rem' }}>Counteroffer</span>
        </Button>
        <Button
          loading={checking || accepting}
          disabled={isDisabled || checking || accepting}
          onClick={handleReviewClick}
          color="green"
          variant="solid"
        >
          <Icon icon="check" />
          <span style={{ marginLeft: '0.7rem' }}>Review & accept</span>
        </Button>
      </div>
      {reviewSnapshot && (
        <ReviewModal
          review={{
            mode: 'accept',
            terms: getViewerTradeTerms(reviewSnapshot, myId)
          }}
          partnerName={partnerName}
          groupObjs={groupObjs}
          onInspectCard={onInspectCard}
          isAICardModalShown={isAICardModalShown}
          onHide={() => setReviewSnapshot(null)}
          onConfirm={handleAcceptClick}
        />
      )}
    </div>
  );

  async function loadReviewedOffer(snapshot: any) {
    const { transaction: current } = await loadPendingTransaction(channelId);
    if (
      !current ||
      current.isCancelled ||
      current.isAccepted ||
      tradeTermsKey(current) !== tradeTermsKey(snapshot)
    ) {
      setReviewSnapshot(null);
      onRefreshTransaction(current);
      return null;
    }
    return current;
  }

  async function handleReviewClick() {
    setChecking(true);
    setAcceptError('');
    try {
      const current = await loadReviewedOffer(transaction);
      if (current) setReviewSnapshot(structuredClone(current));
    } catch {
      setAcceptError('The latest offer could not load. Please try again.');
    } finally {
      setChecking(false);
    }
  }

  async function handleAcceptClick() {
    if (!reviewSnapshot || accepting) return;
    setAccepting(true);
    try {
      if (!(await loadReviewedOffer(reviewSnapshot))) return;
      const { coins, isDisabled, disableReason, responsibleParty } =
        await acceptTrade({ channelId, transactionId: reviewSnapshot.id });
      if (isDisabled) {
        setDisableReasonObj({ reason: disableReason, responsibleParty });
        setIsDisabled(true);
        setReviewSnapshot(null);
        return;
      }
      void applyCanonicalCoinsAndReconcile({
        coins,
        loadCoins,
        onSetUserState,
        userId: myId
      });
      setReviewSnapshot(null);
      onAcceptTrade();
    } finally {
      setAccepting(false);
    }
  }
}
