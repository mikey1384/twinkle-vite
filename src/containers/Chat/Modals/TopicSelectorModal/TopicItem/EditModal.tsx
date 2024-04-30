import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';

export default function EditModal({ onHide }: { onHide: () => void }) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [submitting, setSubmitting] = useState(false);
  return (
    <Modal modalOverModal onHide={onHide}>
      <header>test</header>
      <main>test</main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button loading={submitting} color={doneColor} onClick={handleConfirm}>
          Confirm
        </Button>
      </footer>
    </Modal>
  );

  async function handleConfirm() {
    try {
      setSubmitting(true);
    } catch (error) {
      console.error(error);
      setSubmitting(false);
    }
  }
}
