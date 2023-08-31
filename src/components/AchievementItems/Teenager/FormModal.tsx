import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';

export default function FormModal({ onHide }: { onHide: () => void }) {
  return (
    <Modal onHide={onHide}>
      <header>Additional Profile Details</header>
      <main>
        <p>Form</p>
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
