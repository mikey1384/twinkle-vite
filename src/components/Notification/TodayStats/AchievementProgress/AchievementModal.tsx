import React, { useEffect, useMemo } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import AchievementItem from '~/components/AchievementItem';
import NextMission from './NextMission';
import { useRoleColor } from '~/theme/useRoleColor';
import { Color } from '~/constants/css';

export default function AchievementModal({
  achievement,
  onHide,
  onShown
}: {
  achievement: any;
  onHide: () => void;
  onShown: () => void;
}) {
  const doneRole = useRoleColor('done', { fallback: 'blue' });
  const doneColor = useMemo(
    () => doneRole.getColor() || Color.blue(),
    [doneRole]
  );

  useEffect(() => {
    onShown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      isOpen
      onClose={onHide}
      closeOnBackdropClick={false}
      hasHeader={false}
      bodyPadding={0}
    >
      <LegacyModalLayout>
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
      </LegacyModalLayout>
    </Modal>
  );
}
