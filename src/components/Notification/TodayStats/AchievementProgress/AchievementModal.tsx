import React, { useEffect } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import AchievementItem from '~/components/AchievementItem';
import NextMission from './NextMission';
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
    <Modal closeWhenClickedOutside={false} onHide={onHide}>
      <header>{achievement.title}</header>
      <main
        style={{
          paddingTop: 0,
          minHeight: '15rem',
          justifyContent: 'center'
        }}
      >
        <AchievementItem achievement={achievement} />
        {achievement.type === 'mission' && (
          <NextMission
            style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}
          />
        )}
      </main>
      <footer>
        <Button color={doneColor} onClick={onHide}>
          Ok
        </Button>
      </footer>
    </Modal>
  );
}
