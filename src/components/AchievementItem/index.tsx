import React from 'react';
import Big from './Big';
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
    <div>small</div>
  ) : (
    <Big achievement={achievement} style={style} />
  );
}
