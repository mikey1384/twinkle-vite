import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';

export default function BookmarkModal({
  onHide,
  bookmark
}: {
  onHide: () => void;
  bookmark: any;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  return (
    <Modal onHide={onHide}>
      <main style={{ justifyContent: 'center', minHeight: '15rem' }}>
        {bookmark.content}
      </main>
      <footer>
        <Button color={doneColor} onClick={onHide}>
          OK
        </Button>
      </footer>
    </Modal>
  );
}
