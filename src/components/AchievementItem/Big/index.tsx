import React from 'react';
import Mission from './Mission';
import Summoner from './Summoner';
import Grammar from './Grammar';
import Mentor from './Mentor';
import Teenager from './Teenager';
import Adult from './Adult';
import Sage from './Sage';
import TwinkleFounder from './TwinkleFounder';
import { Content } from '~/types';

export default function Big({
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
