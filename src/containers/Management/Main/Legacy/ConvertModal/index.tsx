import React, { useState } from 'react';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import FromPanel from './FromPanel';
import ToPanel from './ToPanel';
import { css } from '@emotion/css';
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
      <header
        className={css`
          font-size: 2rem;
          font-weight: 600;
        `}
      >
        Convert
      </header>
      <main>
        <FromPanel target={target} />
        <ToPanel target={target} />
      </main>
      <footer
        className={css`
          display: flex;
          justify-content: flex-end;
          margin-top: 1rem;
        `}
      >
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
