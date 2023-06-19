import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';

export default function ConfirmModal({ onHide }: { onHide: () => void }) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  return (
    <Modal onHide={onHide}>
      <header>Under Construction</header>
      <main>Still working on this feature. Please check back later.</main>
      <footer>
        <Button color={doneColor} onClick={onHide}>
          Okay
        </Button>
      </footer>
    </Modal>
  );
}
