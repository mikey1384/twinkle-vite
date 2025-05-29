import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

const radiusSmall = '6px';

interface ThemeDisplayProps {
  themes: string[];
}

export default function ThemeDisplay({ themes }: ThemeDisplayProps) {
  if (themes.length === 0) return null;

  const themeCls = css`
    background: ${Color.orange(0.08)};
    border: 1px solid ${Color.orange(0.3)};
    border-radius: ${radiusSmall};
    padding: 0.5rem 1rem;
    text-align: center;
    font-size: 1.2rem;
    color: ${Color.orange()};
    font-weight: 500;
  `;

  return (
    <div className={themeCls}>
      Theme:{' '}
      {themes
        .join(', ')
        .replace(/([A-Z])/g, ' $1')
        .toLowerCase()}
    </div>
  );
}
