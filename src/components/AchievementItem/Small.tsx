import React from 'react';
import SmallMission from '~/components/AchievementItems/Small/Mission';
import SmallSummoner from '~/components/AchievementItems/Small/Summoner';
import SmallGrammar from '~/components/AchievementItems/Small/Grammar';
import SmallMentor from '~/components/AchievementItems/Small/Mentor';
import SmallTeenager from '~/components/AchievementItems/Small/Teenager';
import SmallAdult from '~/components/AchievementItems/Small/Adult';
import SmallSage from '~/components/AchievementItems/Small/Sage';
import SmallTwinkleFounder from '~/components/AchievementItems/Small/TwinkleFounder';
import { Content } from '~/types';

export default function Small({
  achievement,
  style
}: {
  achievement: Content;
  style?: React.CSSProperties;
}) {
  const achievementComponentMap: {
    [key: string]: React.ComponentType<{
      data: any;
      style?: React.CSSProperties;
    }>;
  } = {
    mission: SmallMission,
    summoner: SmallSummoner,
    grammar: SmallGrammar,
    teenager: SmallTeenager,
    adult: SmallAdult,
    mentor: SmallMentor,
    sage: SmallSage,
    twinkle_founder: SmallTwinkleFounder
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
        data={achievement}
        style={{ width: '100%' }}
      />
    </div>
  );
}
