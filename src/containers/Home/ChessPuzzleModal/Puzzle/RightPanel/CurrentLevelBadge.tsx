import React from 'react';
import { Color } from '~/constants/css';
import { radiusSmall } from '../styles';

export default function CurrentLevelBadge({
  currentLevel
}: {
  currentLevel: number;
}) {
  return (
    <div
      style={{
        background: Color.logoBlue(0.08),
        border: `1px solid ${Color.logoBlue(0.3)}`,
        borderRadius: radiusSmall,
        padding: '0.5rem 1rem',
        fontWeight: 600,
        alignSelf: 'flex-start',
        marginBottom: '0.75rem'
      }}
    >
      Level {currentLevel}
    </div>
  );
}
