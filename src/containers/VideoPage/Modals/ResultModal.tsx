import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';

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
    <Modal onHide={onHide}>
      <header>Your Results</header>
      <main>
        <p>{`You've correctly answered ${number} out of ${totalQuestions} question(s).`}</p>
        {perfect && <p>Perfect :)</p>}
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
