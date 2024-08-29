import React, { useEffect, useState } from 'react';
import Icon from './Icon';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

interface DraftSaveIndicatorProps {
  savingState: 'idle' | 'saving' | 'saved';
}

export default function DraftSaveIndicator({
  savingState
}: DraftSaveIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (savingState !== 'idle') {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [savingState]);

  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        font-size: 1.3rem;
        color: ${Color.gray()};
        transition: opacity 0.3s ease-in-out;
        opacity: ${visible ? 1 : 0};
        visibility: ${visible ? 'visible' : 'hidden'};
      `}
    >
      {savingState === 'saved' && (
        <>
          <Icon icon="check-circle" />
          <span style={{ marginLeft: '0.5rem' }}>Draft saved</span>
        </>
      )}
      {savingState === 'saving' && <span>Saving draft...</span>}
    </div>
  );
}
