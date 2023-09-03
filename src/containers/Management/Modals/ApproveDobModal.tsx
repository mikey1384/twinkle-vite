import React, { useState } from 'react';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';

export default function ApproveDobModal({
  target,
  onHide
}: {
  target: {
    username: string;
  };
  onHide: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  // const approveDob = useAppContext((v) => v.requestHelpers.approveDob);
  // const onApproveDob = useManagementContext((v) => v.actions.onApproveDob);

  return (
    <Modal onHide={onHide}>
      <header>Approve Date of Birth</header>
      <main>
        <div
          style={{
            marginTop: '1rem',
            fontWeight: 'bold',
            fontSize: '2rem',
            color: Color.logoBlue()
          }}
        >
          {target.username}
        </div>
      </main>
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
