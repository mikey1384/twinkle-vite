import React from 'react';
import Mission from './Mission';
import Grammar from './Grammar';
import Gold from './Gold';
import { Content } from '~/types';

export default function AchievementItem({
  achievement,
  thumbSize,
  style
}: {
  isSmall?: boolean;
  isNotification?: boolean;
  isThumb?: boolean;
  achievement: Content;
  thumbSize?: string;
  style?: React.CSSProperties;
}) {
  const achievementComponentMap: {
    [key: string]: React.ComponentType<{
      data: any;
      isThumb?: boolean;
      thumbSize?: string;
      style?: React.CSSProperties;
    }>;
  } = {
    mission: Mission,
    grammar: Grammar,
    gold: Gold
  };

  const Component = achievement?.type
    ? achievementComponentMap[achievement.type]
    : undefined;
  if (!Component || !achievement?.type) {
    return null;
  }

  return (
    <div style={style}>
      <Component
        key={achievement?.type}
        thumbSize={thumbSize}
        data={achievement}
        style={{ width: '100%' }}
      />
    </div>
  );
}
