import React from 'react';
import Mission from '~/components/AchievementItems/Big/Mission';
import Summoner from '~/components/AchievementItems/Big/Summoner';
import Grammar from '~/components/AchievementItems/Big/Grammar';
import Mentor from '~/components/AchievementItems/Big/Mentor';
import Teenager from '~/components/AchievementItems/Big/Teenager';
import Adult from '~/components/AchievementItems/Big/Adult';
import Sage from '~/components/AchievementItems/Big/Sage';
import TwinkleFounder from '~/components/AchievementItems/Big/TwinkleFounder';
import { Content } from '~/types';

export default function AchievementItem({
  achievement,
  style
}: {
  achievement: Content;
  style?: React.CSSProperties;
}) {
  const achievementComponentMap: {
    [key: string]: React.ComponentType<{
      isNotification?: boolean;
      data: any;
      style?: React.CSSProperties;
    }>;
  } = {
    mission: Mission,
    summoner: Summoner,
    grammar: Grammar,
    teenager: Teenager,
    adult: Adult,
    mentor: Mentor,
    sage: Sage,
    twinkle_founder: TwinkleFounder
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
        padding: '1rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        width: '100%',
        ...style
      }}
    >
      <Component
        key={achievement?.type}
        isNotification
        data={achievement}
        style={{ width: '100%' }}
      />
    </div>
  );
}
