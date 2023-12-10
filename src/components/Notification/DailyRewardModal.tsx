import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';

export default function DailyRewardModal({
  onHide,
  modalOverModal
}: {
  onHide: () => void;
  modalOverModal?: boolean;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  return (
    <Modal modalOverModal={modalOverModal} onHide={onHide}>
      <header>Daily Reward</header>
      <main style={{ justifyContent: 'center', minHeight: '15rem' }}>
        This is daily reward
      </main>
      <footer>
        <Button color={doneColor} onClick={onHide}>
          OK
        </Button>
      </footer>
    </Modal>
  );
}
