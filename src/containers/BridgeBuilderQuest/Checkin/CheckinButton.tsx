import React, { useState } from 'react';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import FormModal from '~/components/AchievementItem/FormModal';
import { useAppContext } from '~/contexts';
import { QuestNote } from '../StepCard';
import CheckinModal from './CheckinModal';
import type { CheckinProgress } from '../types';

// The Check in button for places other than the checkpoint card (a crew's
// page, its chat panel): loads my check-ins when tapped and opens the same
// check-in window.
export default function CheckinButton({
  label = 'Check in',
  size = 'md',
  onChanged
}: {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  onChanged?: () => void;
}) {
  const loadMeetupCheckins = useAppContext(
    (v) => v.requestHelpers.loadMeetupCheckins
  );
  const [progress, setProgress] = useState<CheckinProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [birthdateShown, setBirthdateShown] = useState(false);
  const [error, setError] = useState('');
  return (
    <>
      <GameCTAButton
        variant="success"
        size={size}
        icon="qrcode"
        loading={loading}
        onClick={handleOpen}
      >
        {label}
      </GameCTAButton>
      {error && <QuestNote tone="warning">{error}</QuestNote>}
      {progress && (
        <CheckinModal
          progress={progress}
          onProgress={setProgress}
          onAddBirthdate={() => {
            setProgress(null);
            setBirthdateShown(true);
          }}
          onHide={() => {
            setProgress(null);
            onChanged?.();
          }}
        />
      )}
      {birthdateShown && (
        <FormModal
          header="Your birthdate"
          type="dob"
          onHide={() => setBirthdateShown(false)}
        />
      )}
    </>
  );

  async function handleOpen() {
    setLoading(true);
    setError('');
    try {
      setProgress(await loadMeetupCheckins());
    } catch (err: any) {
      setError(err?.message || 'Could not open check-in.');
    } finally {
      setLoading(false);
    }
  }
}
