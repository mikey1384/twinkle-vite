import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';

export default function DailyBonusModal({ onHide }: { onHide: () => void }) {
  return (
    <Modal wrapped onHide={onHide}>
      <header>Daily Reward</header>
      <main>bonus reward</main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
