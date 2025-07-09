import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { metaFor } from './statusMeta';
import { pulseAnimation } from './animations';

interface StatusIconProps {
  status?: string;
}

export default function StatusIcon({ status }: StatusIconProps) {
  const { icon, color } = metaFor(status);
  
  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${color};
        color: #fff;
        font-size: 1.4rem;
        animation: ${status === 'thinking_complete' ? 'none' : pulseAnimation}
          2s infinite;
        z-index: 1;
      `}
    >
      <Icon icon={icon} />
    </div>
  );
}