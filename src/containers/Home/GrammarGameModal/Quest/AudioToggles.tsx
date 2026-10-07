import React, { useState } from 'react';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import PixelIcon from './PixelIcon';
import { isQuestMuted, playQuestSound, setQuestMuted } from './sfx';
import { musicEnabled, setMusicEnabled } from './MarbleRun/music';
import { PLATE, frame } from './pixelUi';

// The sound-effects and music switches, as the map's pixel chips. Used on
// the map and in a run's top bar; both choices are saved on the account.
export default function AudioToggles({ className }: { className?: string }) {
  const [muted, setMuted] = useState(isQuestMuted);
  const [music, setMusic] = useState(musicEnabled);
  return (
    <span className={cx(rowCls, className)}>
      <button
        className={chipCls}
        aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
        aria-pressed={!muted}
        onClick={() => {
          setQuestMuted(!muted);
          setMuted(!muted);
          if (muted) playQuestSound('select');
        }}
      >
        <PixelIcon name={muted ? 'soundOff' : 'soundOn'} />
      </button>
      <button
        className={chipCls}
        aria-label={music ? 'Turn music off' : 'Turn music on'}
        aria-pressed={music}
        onClick={() => {
          setMusicEnabled(!music);
          setMusic(!music);
        }}
      >
        <PixelIcon name={music ? 'musicOn' : 'musicOff'} />
      </button>
    </span>
  );
}

const rowCls = css`
  display: inline-flex;
  gap: 0.6rem;
  flex-shrink: 0;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.4rem;
  }
`;
const chipCls = css`
  ${frame(PLATE, 2)}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 4.4rem;
  min-height: 4.4rem;
  padding: 0 0.6rem;
  cursor: pointer;
  transition: transform 0.06s;
  &:active {
    transform: translateY(2px);
  }
  @media (max-width: ${mobileMaxWidth}) {
    min-width: 4rem;
    min-height: 4rem;
  }
  @media (max-height: 520px) and (orientation: landscape) {
    min-height: 3.4rem;
    min-width: 3.4rem;
  }
`;
