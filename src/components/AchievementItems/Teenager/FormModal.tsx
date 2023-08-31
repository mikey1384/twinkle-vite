import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';

export default function FormModal({ onHide }: { onHide: () => void }) {
  const [dob, setDob] = useState('');
  return (
    <Modal onHide={onHide}>
      <header>Additional Profile Details</header>
      <main>
        Enter Your Birthdate
        <div style={{ marginTop: '1rem' }}>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
