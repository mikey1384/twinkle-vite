import React from 'react';
import Big from './Big';
import Small from './Small';
import { Content } from '~/types';

export default function AchievementItem({
  isSmall,
  isNotification,
  isThumb,
  achievement,
  style
}: {
  isSmall?: boolean;
  isNotification?: boolean;
  isThumb?: boolean;
  achievement: Content;
  style?: React.CSSProperties;
}) {
  return isSmall ? (
    <Small isThumb={isThumb} achievement={achievement} style={style} />
  ) : (
    <Big
      isThumb={isThumb}
      isNotification={isNotification}
      achievement={achievement}
      style={style}
    />
  );
}
