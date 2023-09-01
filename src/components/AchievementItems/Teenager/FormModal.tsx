import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';
import { borderRadius, Color } from '~/constants/css';

export default function FormModal({ onHide }: { onHide: () => void }) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [dob, setDob] = useState('');
  return (
    <Modal onHide={onHide}>
      <header>Additional Profile Details</header>
      <main>
        <label
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: Color.black()
          }}
        >
          Enter Your Birthdate
        </label>
        <div
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            style={{
              padding: '0.5rem',
              fontSize: '1.3rem',
              border: `1px solid ${Color.borderGray()}`,
              borderRadius
            }}
          />
        </div>
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Close
        </Button>
        <Button disabled={!dob} color={doneColor} onClick={handleSubmit}>
          Submit
        </Button>
      </footer>
    </Modal>
  );

  async function handleSubmit() {
    console.log(dob);
    onHide();
  }
}
