import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

export default function EditModal({ onHide }: { onHide: () => void }) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [submitting, setSubmitting] = useState(false);
  return (
    <Modal modalOverModal onHide={onHide}>
      <header>Edit Topic</header>
      <main>
        <div
          style={{
            width: '100%',
            height: '15rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Input
            className={css`
              width: 50%;
              @media (max-width: 800px) {
                width: 100%;
              }
            `}
            placeholder="Enter topic..."
            value="topic to change"
            onChange={(text) => console.log(text)}
          />
        </div>
      </main>
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
