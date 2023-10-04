import React, { useState } from 'react';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import CurrentPerks from './CurrentPerks';
import AchievementStatus from './AchievementStatus';
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
        <div
          className={css`
            font-weight: bold;
            font-family: Roboto, sans-serif;
            margin: 1rem 0;
          `}
        >
          From
        </div>
        <div
          className={css`
            width: 100%;
            border-radius: 8px;
            border: 1px solid #ccc;
            padding: 1rem;
            margin-bottom: 1rem;
          `}
        >
          <CurrentPerks target={target} />
          <AchievementStatus target={target} />
        </div>
        <div
          className={css`
            margin: 2rem 0rem 1rem 0;
            font-weight: bold;
            font-family: Roboto, sans-serif;
          `}
        >
          To
        </div>
        <div
          className={css`
            width: 100%;
            border-radius: 8px;
            border: 1px solid #ccc;
            padding: 1rem;
            margin-bottom: 1rem;
          `}
        >
          <div>something will go here later</div>
        </div>
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
