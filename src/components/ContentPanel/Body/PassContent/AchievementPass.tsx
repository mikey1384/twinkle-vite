import React from 'react';
import Mission from '~/components/AchievementItems/Mission';
import Summoner from '~/components/AchievementItems/Summoner';
import Grammar from '~/components/AchievementItems/Grammar';
import Mentor from '~/components/AchievementItems/Mentor';
import Teenager from '~/components/AchievementItems/Teenager';
import Sage from '~/components/AchievementItems/Sage';
import Founder from '~/components/AchievementItems/Founder';
import { Content } from '~/types';

export default function AchievementPass({
  achievement,
  style
}: {
  achievement: Content;
  style: React.CSSProperties;
}) {
  const achievementComponentMap: {
    [key: string]: React.ComponentType<{
      data: any;
      style?: React.CSSProperties;
    }>;
  } = {
    mission: Mission,
    summoner: Summoner,
    grammar: Grammar,
    teenager: Teenager,
    mentor: Mentor,
    sage: Sage,
    founder: Founder
  };
  const Component = achievement?.key
    ? achievementComponentMap[achievement.key]
    : undefined;

  if (!Component || !achievement?.key) {
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
        marginBottom: '-4rem',
        width: '100%',
        ...style
      }}
    >
      <Component
        key={achievement?.key}
        data={achievement}
        style={{ width: '100%' }}
      />
    </div>
  );
}
