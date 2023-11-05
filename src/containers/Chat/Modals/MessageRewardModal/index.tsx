import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import RewardReason from './RewardReason';
import RewardLevelForm from '~/components/Forms/RewardLevelForm';
import { rewardReasons } from '~/constants/defaultValues';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useKeyContext } from '~/contexts';

export default function MessageRewardModal({
  onHide,
  userToReward,
  onSubmit
}: {
  onHide: () => void;
  userToReward: any;
  onSubmit: (v: { reasonId: number; amount: number }) => void;
}) {
  const { isAdmin } = useKeyContext((v) => v.myState);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [selectedReasonId, setSelectedReasonId] = useState(0);
  const [rewardAmount, setRewardAmount] = useState(0);
  const submitDisabled = useMemo(
    () => !rewardAmount || !selectedReasonId,
    [rewardAmount, selectedReasonId]
  );

  return (
    <Modal onHide={onHide}>
      <header>Reward {userToReward.username}</header>
      <main>
        <div style={{ width: '100%' }}>
          <div
            style={{
              width: '100%',
              textAlign: 'center',
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem'
            }}
          >
            <span>{addCommasToNumber(rewardAmount * 200)} XP</span>
          </div>
          <RewardLevelForm
            icon="certificate"
            extendedRewardLevels={!!isAdmin}
            rewardLevel={rewardAmount}
            onSetRewardLevel={setRewardAmount}
            style={{ width: '100%', textAlign: 'center', fontSize: '3rem' }}
          />
        </div>
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
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
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </footer>
    </Modal>
  );

  function handleSubmit() {
    onSubmit({
      reasonId: selectedReasonId,
      amount: rewardAmount * 200
    });
    onHide();
  }
}
