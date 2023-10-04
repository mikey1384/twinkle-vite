import React from 'react';
import Big from './Big';
import Small from './Small';
import { Content } from '~/types';

export default function AchievementItem({
  isSmall,
  achievement,
  style
}: {
  isSmall?: boolean;
  achievement: Content;
  style?: React.CSSProperties;
}) {
  return isSmall ? (
    <Small achievement={achievement} style={style} />
  ) : (
    <Big achievement={achievement} style={style} />
  );
}
