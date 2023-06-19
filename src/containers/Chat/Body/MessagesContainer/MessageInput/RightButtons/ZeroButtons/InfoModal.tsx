import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const cancelLabel = localize('cancel');

export default function ConfirmModal({ onHide }: { onHide: () => void }) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  return (
    <Modal onHide={onHide}>
      <header>Under Construction</header>
      <main>Still working on this feature. Please check back later.</main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          {cancelLabel}
        </Button>
        <Button color={doneColor} onClick={handleConfirm}>
          Okay
        </Button>
      </footer>
    </Modal>
  );

  function handleConfirm() {
    onHide();
  }
}
