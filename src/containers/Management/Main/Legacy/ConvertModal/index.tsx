import React, { useState } from 'react';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import ConvertFrom from './ConvertFrom';
import AchievementStatus from './AchievementStatus';
import { User } from '~/types';
import { useKeyContext } from '~/contexts';

export default function ConvertModal({
  target,
  onHide
}: {
  target: User;
  onHide: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  return (
    <Modal onHide={onHide}>
      <header>Convert</header>
      <main>
        <ConvertFrom target={target} />
        <AchievementStatus />
      </main>
      <footer>
        <Button transparent onClick={onHide} style={{ marginRight: '0.7rem' }}>
          Cancel
        </Button>
        <Button loading={loading} color={doneColor} onClick={handleSubmit}>
          Convert
        </Button>
      </footer>
    </Modal>
  );

  async function handleSubmit() {
    setLoading(true);
    onHide();
  }
}
