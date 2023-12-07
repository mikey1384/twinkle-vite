import React from 'react';
import Mission from './Mission';
import Grammar from './Grammar';
import Gold from './Gold';
import { Content } from '~/types';

export default function AchievementItem({
  isThumb,
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
    <div
      style={{
        ...(isThumb
          ? {}
          : {
              padding: '1rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              width: '100%'
            }),
        ...style
      }}
    >
      <Component
        key={achievement?.type}
        thumbSize={thumbSize}
        isThumb={isThumb}
        data={achievement}
        style={{ width: '100%' }}
      />
    </div>
  );
}
