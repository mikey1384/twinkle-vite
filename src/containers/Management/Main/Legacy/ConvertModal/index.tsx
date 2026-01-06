import React, { useEffect, useMemo, useState } from 'react';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import FromPanel from './FromPanel';
import ToPanel from './ToPanel';
import { css } from '@emotion/css';
import { User } from '~/types';
import { useAppContext } from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';
import { Color } from '~/constants/css';

export default function ConvertModal({
  target,
  onDone,
  onHide
}: {
  target: User;
  onDone: () => void;
  onHide: () => void;
}) {
  const convertUser = useAppContext((v) => v.requestHelpers.convertUser);
  const loadAchievementsByUserId = useAppContext(
    (v) => v.requestHelpers.loadAchievementsByUserId
  );
  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const doneRole = useRoleColor('done', { fallback: 'blue' });
  const doneColor = useMemo(
    () => doneRole.getColor() || Color.blue(),
    [doneRole]
  );

  const [submitting, setSubmitting] = useState(false);
  const [loadingUserAchievements, setLoadingUserAchievements] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);

  useEffect(() => {
    async function init() {
      setLoadingUserAchievements(true);
      const unlockedAchievements = await loadAchievementsByUserId(target.id);
      setUnlockedAchievements(unlockedAchievements);
      setLoadingUserAchievements(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal modalKey="ConvertModal" isOpen onClose={onHide} hasHeader={false} bodyPadding={0}>
      <LegacyModalLayout>
        <header
          className={css`
            font-size: 2rem;
            font-weight: 600;
          `}
        >
          Convert
        </header>
        <main>
          <FromPanel
            loading={loadingUserAchievements}
            unlockedAchievements={unlockedAchievements}
            target={target}
          />
          <ToPanel
            loading={loadingUserAchievements}
            unlockedAchievements={unlockedAchievements}
            achievementsObj={achievementsObj}
            target={target}
          />
        </main>
        <footer
          className={css`
            display: flex;
            justify-content: flex-end;
            margin-top: 1rem;
          `}
        >
          <Button
            variant="ghost"
            onClick={onHide}
            style={{ marginRight: '0.7rem' }}
          >
            Cancel
          </Button>
          <Button loading={submitting} color={doneColor} onClick={handleSubmit}>
            Convert
          </Button>
        </footer>
      </LegacyModalLayout>
    </Modal>
  );

  async function handleSubmit() {
    setSubmitting(true);
    await convertUser(target.id);
    onDone();
  }
}
