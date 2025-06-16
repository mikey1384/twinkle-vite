import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function DraftSaveIndicator({
  savingState
}: {
  savingState: 'idle' | 'saved';
}) {
  const [visible, setVisible] = useState(false);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    if (savingState !== 'idle') {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [savingState]);

  // iOS-specific: Force layout recalculation when visibility changes
  useEffect(() => {
    if (isIOS) {
      requestAnimationFrame(() => {
        // Touch the DOM to force reflow
        document.body.offsetHeight;
      });
    }
  }, [visible, isIOS]);

  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        font-size: 1.3rem;
        color: ${Color.lightGray()};
        transition: opacity 0.3s ease-in-out;
        opacity: ${visible ? 1 : 0};
        visibility: ${visible ? 'visible' : 'hidden'};
      `}
    >
      {savingState === 'saved' && <span>Draft saved</span>}
    </div>
  );
}
