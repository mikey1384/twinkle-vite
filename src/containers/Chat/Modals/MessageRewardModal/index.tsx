import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import RewardReason from './RewardReason';
import RewardLevelForm from '~/components/Forms/RewardLevelForm';
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
  onSubmit: (v: { reasonId: number; amount: number }) => void;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const { twinkleCoins } = useKeyContext((v) => v.myState);
  const [selectedReasonId, setSelectedReasonId] = useState(0);
  const [rewardAmount, setRewardAmount] = useState(0);
  const submitDisabled = useMemo(
    () =>
      !rewardAmount || !selectedReasonId || rewardAmount * 200 > twinkleCoins,
    [rewardAmount, selectedReasonId, twinkleCoins]
  );
  const displayedRewardAmount = useMemo(
    () => addCommasToNumber(rewardAmount * 200),
    [rewardAmount]
  );

  return (
    <Modal onHide={onHide}>
      <header
        className={css`
          font-size: 1.5rem;
          font-weight: bold;
        `}
      >
        Reward {userToReward.username}
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
                font-size: 2rem;
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
                  font-size: 1.3rem;
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
                font-size: 1.2rem;
              `}
            >
              You do not have enough coins to reward this amount.
            </div>
          )}
          <RewardLevelForm
            icon="certificate"
            extendedRewardLevels
            rewardLevel={rewardAmount}
            onSetRewardLevel={setRewardAmount}
            style={{
              width: '100%',
              textAlign: 'center',
              marginTop: '1.5rem',
              fontSize: '3rem'
            }}
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
              key={key}
              reasonId={Number(key)}
              selectedReasonId={selectedReasonId}
              onSelectReasonId={setSelectedReasonId}
              style={{ marginTop: '1rem' }}
            />
          ))}
        </div>
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          color={doneColor}
          disabled={submitDisabled}
          style={{ marginRight: '0.7rem' }}
          onClick={() =>
            onSubmit({
              reasonId: selectedReasonId,
              amount: rewardAmount * 200
            })
          }
        >
          Submit
        </Button>
      </footer>
    </Modal>
  );
}
