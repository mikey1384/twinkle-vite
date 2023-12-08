import React, { useEffect } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import AchievementItem from '~/components/AchievementItem';
import { useKeyContext } from '~/contexts';

export default function AchievementModal({
  achievement,
  onHide,
  onShown
}: {
  achievement: any;
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
      <header>{achievement.title}</header>
      <main
        style={{
          paddingTop: 0,
          minHeight: '15rem',
          justifyContent: 'center'
        }}
      >
        <AchievementItem achievement={achievement} />
      </main>
      <footer>
        <Button color={doneColor} onClick={onHide}>
          Ok
        </Button>
      </footer>
    </Modal>
  );
}
