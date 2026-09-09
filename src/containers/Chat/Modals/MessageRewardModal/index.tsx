import React, { useEffect, useMemo, useRef, useState } from 'react';
import ModalFooter from '~/components/Modal/Footer';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import RewardReason from './RewardReason';
import RewardAmountPicker, { rewardLevels } from './RewardAmountPicker';
import { rewardReasons } from '~/constants/defaultValues';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function MessageRewardModal({
  onHide,
  userToReward,
  onSubmit
}: {
  onHide: () => void;
  userToReward: any;
  onSubmit: (v: { reasonId: number; amount: number }) => void | Promise<void>;
}) {
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const [selectedReasonId, setSelectedReasonId] = useState(0);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const attempted = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const submitDisabled = useMemo(
    () =>
      !rewardLevels.includes(rewardAmount) ||
      !rewardReasons[selectedReasonId] ||
      !Number.isFinite(twinkleCoins) ||
      rewardAmount * 200 > twinkleCoins,
    [rewardAmount, selectedReasonId, twinkleCoins]
  );
  const displayedRewardAmount = useMemo(
    () => addCommasToNumber(rewardAmount * 200),
    [rewardAmount]
  );

  return (
    <Modal
      modalKey="MessageRewardModal"
      aria-label={`Reward ${userToReward?.username || 'message author'}`}
      isOpen
      onClose={handleClose}
      hasHeader={false}
      bodyPadding={0}
    >
      <LegacyModalLayout>
        <header
          style={{ fontSize: '20px', overflowWrap: 'anywhere', minWidth: 0 }}
          className={css`
            font-size: 1.5rem;
            font-weight: bold;
          `}
        >
          Reward {userToReward?.username}
        </header>
        <main>
          <div style={{ width: '100%' }}>
            <div
              className={css`
                text-align: center;
              `}
            >
              <div
                className={css`
                  font-size: 24px;
                  font-weight: bold;
                `}
              >
                {displayedRewardAmount} XP
              </div>
              {!!rewardAmount && (
                <div
                  className={css`
                    margin-left: 1rem;
                    color: ${Color.darkerGray()};
                    font-size: 14px;
                  `}
                >
                  ({displayedRewardAmount} coins)
                </div>
              )}
            </div>
            {rewardAmount * 200 > twinkleCoins && (
              <div
                className={css`
                  width: 100%;
                  text-align: center;
                  color: red;
                  margin-bottom: 1rem;
                  font-size: 14px;
                `}
              >
                You do not have enough coins to reward this amount.
              </div>
            )}
            <RewardAmountPicker
              disabled={pending || submitted}
              rewardLevel={rewardAmount}
              onSetRewardLevel={setRewardAmount}
            />
          </div>
          <div
            className={css`
              margin-top: 1rem;
              display: flex;
              flex-direction: column;
              align-items: center;
            `}
          >
            {Object.keys(rewardReasons).map((key) => (
              <RewardReason
                disabled={pending || submitted}
                key={key}
                reasonId={Number(key)}
                selectedReasonId={selectedReasonId}
                onSelectReasonId={setSelectedReasonId}
                style={{
                  marginTop: '8px',
                  minHeight: '44px',
                  fontSize: '14px',
                  width: '100%',
                  lineHeight: 1.5
                }}
              />
            ))}
          </div>
        </main>
        <ModalFooter style={{ flexWrap: 'wrap' }}>
          {error && (
            <p
              role="alert"
              style={{
                width: '100%',
                margin: 0,
                fontSize: '16px',
                lineHeight: 1.5
              }}
            >
              {error}
            </p>
          )}
          {pending && (
            <p
              role="status"
              style={{
                width: '100%',
                margin: 0,
                fontSize: '16px',
                lineHeight: 1.5
              }}
            >
              Sending reward…
            </p>
          )}
          <Button
            variant="ghost"
            style={{ minHeight: '44px', fontSize: '14px' }}
            onClick={handleClose}
            disabled={pending}
          >
            {submitted ? 'Close' : 'Cancel'}
          </Button>
          <Button
            color={doneColor}
            disabled={submitDisabled || pending || submitted}
            loading={pending}
            style={{ minHeight: '44px', fontSize: '14px' }}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </ModalFooter>
      </LegacyModalLayout>
    </Modal>
  );

  function handleClose() {
    if (!pending && !(attempted.current && !submitted)) onHide();
  }

  async function handleSubmit() {
    if (submitDisabled || attempted.current || !mounted.current) return;
    attempted.current = true;
    setPending(true);
    try {
      await onSubmit({
        reasonId: selectedReasonId,
        amount: rewardAmount * 200
      });
    } catch {
      if (mounted.current)
        setError(
          'Could not confirm the reward. It may have been partially processed. Check your coin balance and the chat before sending another reward.'
        );
    } finally {
      if (mounted.current) {
        setPending(false);
        setSubmitted(true);
      }
    }
  }
}
