import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import { useKeyContext } from '~/contexts';

const cancelLabel = localize('cancel');
const confirmLabel = localize('confirm');

export default function TitleSelectionModal({
  modalOverModal,
  onHide
}: {
  modalOverModal?: boolean;
  onHide: () => void;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [submitting, setSubmitting] = useState(false);
  return (
    <Modal modalOverModal={modalOverModal} onHide={onHide}>
      <header>Select Your Title</header>
      <main>select your title</main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          {cancelLabel}
        </Button>
        <Button loading={submitting} color={doneColor} onClick={handleConfirm}>
          {confirmLabel}
        </Button>
      </footer>
    </Modal>
  );

  async function handleConfirm() {
    setSubmitting(true);
    console.log('confirming');
    setSubmitting(false);
  }
}
