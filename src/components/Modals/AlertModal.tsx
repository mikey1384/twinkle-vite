import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';

export default function AlertModal({
  onHide,
  modalOverModal,
  title,
  content
}: {
  onHide: () => void;
  modalOverModal?: boolean;
  title: string;
  content: string | React.ReactNode;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  return (
    <Modal modalOverModal={modalOverModal} onHide={onHide}>
      <header>{title}</header>
      <main>{content}</main>
      <footer>
        <Button color={doneColor} onClick={onHide}>
          OK
        </Button>
      </footer>
    </Modal>
  );
}
