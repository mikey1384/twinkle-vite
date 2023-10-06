import React, { useEffect, useState } from 'react';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import FromPanel from './FromPanel';
import ToPanel from './ToPanel';
import { css } from '@emotion/css';
import { User } from '~/types';
import { useAppContext, useKeyContext } from '~/contexts';

const achievementAP: Record<string, number> = {
  grammar: 70,
  mission: 70,
  summoner: 70,
  teenager: 100,
  adult: 100,
  mentor: 800,
  sage: 500,
  twinkle_founder: 1500
};

export default function ConvertModal({
  target,
  onHide
}: {
  target: User;
  onHide: () => void;
}) {
  const loadAchievementsByUserId = useAppContext(
    (v) => v.requestHelpers.loadAchievementsByUserId
  );
  const [submitting, setSubmitting] = useState(false);
  const [loadingUserAchievements, setLoadingUserAchievements] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  useEffect(() => {
    async function init() {
      setLoadingUserAchievements(true);
      const data = await loadAchievementsByUserId(target.id);
      setUnlockedAchievements(data);
      setLoadingUserAchievements(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal onHide={onHide}>
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
          achievementAP={achievementAP}
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
        <Button transparent onClick={onHide} style={{ marginRight: '0.7rem' }}>
          Cancel
        </Button>
        <Button loading={submitting} color={doneColor} onClick={handleSubmit}>
          Convert
        </Button>
      </footer>
    </Modal>
  );

  async function handleSubmit() {
    setSubmitting(true);
    onHide();
  }
}
