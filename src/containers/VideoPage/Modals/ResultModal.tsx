import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { css } from '@emotion/css';

export default function ResultModal({
  numberCorrect,
  totalQuestions,
  onHide
}: {
  numberCorrect: () => number;
  totalQuestions: number;
  onHide: () => void;
}) {
  const number = numberCorrect();
  const perfect = number === totalQuestions;

  return (
    <Modal
      modalKey="ResultModal"
      isOpen
      onClose={onHide}
      title="Your Results"
      size="sm"
      footer={
        <Button variant="ghost" onClick={onHide}>
          Close
        </Button>
      }
    >
      <div
        className={css`
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 8rem;
          width: 100%;
        `}
      >
        <p>{`You've correctly answered ${number} out of ${totalQuestions} question(s).`}</p>
        {perfect && <p style={{ marginTop: '0.5rem' }}>Perfect :)</p>}
      </div>
    </Modal>
  );
}
