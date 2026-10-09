import React, { useState } from 'react';
import { css, cx } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { getStoredItem } from '~/helpers/userDataHelpers';
import { readGrammarblesSettings } from './audioPreferences';
import { setMusicEnabled } from './MarbleRun/music';
import PixelIcon from './PixelIcon';
import { BLUE, GOLD, INK, PARCHMENT, button, frame } from './pixelUi';

export default function MusicChoice() {
  const userId = useKeyContext((v) => v.myState.userId);
  const updateSettings = useAppContext(
    (v) => v.requestHelpers.updateGrammarblesSettings
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  return (
    <section className={panelCls} aria-labelledby="quest-music-title">
      <PixelIcon name="musicOn" scale={4} />
      <h2 id="quest-music-title">Music for your quest?</h2>
      <p>Want background music while you explore and play?</p>
      <div className={choicesCls}>
        <button
          className={cx(choiceCls, onCls)}
          disabled={saving}
          onClick={() => handleChoose(true)}
        >
          <PixelIcon name="musicOn" scale={2} /> Music on
        </button>
        <button
          className={cx(choiceCls, offCls)}
          disabled={saving}
          onClick={() => handleChoose(false)}
        >
          <PixelIcon name="musicOff" scale={2} /> Music off
        </button>
      </div>
      {saving && <p role="status">Saving your choice…</p>}
      {error && <p role="alert">{error}</p>}
      <p className={noteCls}>
        You can change this anytime with the music button.
      </p>
    </section>
  );

  async function handleChoose(music: boolean) {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const result = await updateSettings({ music });
      const saved = readGrammarblesSettings(result?.settings);
      if (typeof saved.music !== 'boolean') throw new Error('Choice not saved');
      if (Number(getStoredItem('userId')) !== userId) return;
      setMusicEnabled(saved.music, { fromAccount: true });
      onSetUserState({ userId, newState: { settings: result.settings } });
    } catch {
      setError('Could not save your choice. Please try again.');
    } finally {
      setSaving(false);
    }
  }
}

const panelCls = css`
  ${frame(PARCHMENT)}
  color: ${INK};
  width: min(52rem, calc(100% - 2rem));
  margin: 3rem auto;
  padding: 2rem;
  text-align: center;
  font-size: 1.6rem;
  h2 {
    margin: 1rem 0;
    font-size: 2.4rem;
  }
  p {
    margin: 1rem 0;
  }
`;
const choicesCls = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin: 2rem 0;
`;
const choiceCls = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  min-height: 4.8rem;
  font-size: 1.3rem;
`;
const onCls = css`
  ${button(GOLD, '#8a5200')}
`;
const offCls = css`
  ${button(BLUE, '#224679', 'white')}
`;
const noteCls = css`
  font-size: 1.3rem;
`;
