import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { metaFor } from './statusMeta';
import { pulseAnimation } from '~/components/StreamingThoughtContent/animations';

interface StatusIconProps {
  status?: string;
  size?: 'small' | 'normal';
}

export default function StatusIcon({
  status,
  size = 'normal'
}: StatusIconProps) {
  const { icon, color } = metaFor(status);
  const isSmall = size === 'small';

  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${isSmall ? '20px' : '32px'};
        height: ${isSmall ? '20px' : '32px'};
        border-radius: 50%;
        background: ${color};
        color: #fff;
        font-size: ${isSmall ? '1rem' : '1.4rem'};
        animation: ${status === 'thinking_complete' ? 'none' : pulseAnimation}
          2s infinite;
        z-index: 1;
      `}
    >
      <Icon icon={icon} />
    </div>
  );
}
