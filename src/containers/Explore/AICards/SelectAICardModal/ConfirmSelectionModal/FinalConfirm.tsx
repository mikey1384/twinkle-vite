import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import { useKeyContext } from '~/contexts';

const cancelLabel = localize('cancel');

export default function ConfirmSelectionModal({
  onHide
}: {
  onHide: () => void;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  return (
    <Modal modalOverModal closeWhenClickedOutside={false} onHide={onHide}>
      <header>Confirm</header>
      <main>final</main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          {cancelLabel}
        </Button>
        <Button color={doneColor} onClick={() => console.log('clicked')}>
          Confirm
        </Button>
      </footer>
    </Modal>
  );
}
