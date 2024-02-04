import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';

export default function TopicSelectorModal({ onHide }: { onHide: () => void }) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  return (
    <Modal onHide={onHide}>
      <header>Select Topic</header>
      <main style={{ justifyContent: 'center', minHeight: '15rem' }}>
        Topic selector
      </main>
      <footer>
        <Button color={doneColor} onClick={onHide}>
          OK
        </Button>
      </footer>
    </Modal>
  );
}
