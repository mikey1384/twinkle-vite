import React, { useEffect } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';

export default function AchievementModal({
  onHide,
  onShown
}: {
  onHide: () => void;
  onShown: () => void;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  useEffect(() => {
    onShown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal onHide={onHide}>
      <header>Achievement</header>
      <main
        style={{
          paddingTop: 0,
          minHeight: '15rem',
          justifyContent: 'center'
        }}
      >
        something
      </main>
      <footer>
        <Button color={doneColor} onClick={onHide}>
          Ok
        </Button>
      </footer>
    </Modal>
  );
}
