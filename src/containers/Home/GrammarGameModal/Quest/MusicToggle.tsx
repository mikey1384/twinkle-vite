import React, { useState } from 'react';
import { css, cx } from '@emotion/css';
import { musicEnabled, setMusicEnabled } from './MarbleRun/music';
import PixelIcon from './PixelIcon';

// Music on/off (Mikey 10-07: players can turn the soundtrack off). Separate
// from the sound-effects switch; saved on the account, off until turned on.
export default function MusicToggle({ className }: { className?: string }) {
  const [on, setOn] = useState(musicEnabled);
  return (
    <button
      className={cx(toggleCls, className)}
      aria-label={on ? 'Turn music off' : 'Turn music on'}
      aria-pressed={on}
      onClick={() => {
        setMusicEnabled(!on);
        setOn(!on);
      }}
    >
      <PixelIcon name={on ? 'musicOn' : 'musicOff'} />
    </button>
  );
}

const toggleCls = css`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 36px;
  cursor: pointer;
`;
