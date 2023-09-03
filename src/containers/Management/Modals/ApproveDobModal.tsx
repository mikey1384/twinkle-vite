import React, { useState } from 'react';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import { useKeyContext } from '~/contexts';

export default function ApproveDobModal({ onHide }: { onHide: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  // const approveDob = useAppContext((v) => v.requestHelpers.approveDob);
  // const onApproveDob = useManagementContext((v) => v.actions.onApproveDob);

  return (
    <Modal onHide={onHide}>
      <header>Add / Edit Moderators</header>
      <main>Something goes here</main>
      <footer>
        <Button transparent onClick={onHide} style={{ marginRight: '0.7rem' }}>
          Cancel
        </Button>
        <Button loading={submitting} color={doneColor} onClick={handleSubmit}>
          Done
        </Button>
      </footer>
    </Modal>
  );

  async function handleSubmit() {
    setSubmitting(true);
    onHide();
  }
}
