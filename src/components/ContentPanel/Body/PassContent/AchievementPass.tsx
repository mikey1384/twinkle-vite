import React from 'react';
import Mission from '~/components/AchievementItems/Mission';
import Summoner from '~/components/AchievementItems/Summoner';
import Grammar from '~/components/AchievementItems/Grammar';
import Mentor from '~/components/AchievementItems/Mentor';
import Teenager from '~/components/AchievementItems/Teenager';
import Sage from '~/components/AchievementItems/Sage';
import Founder from '~/components/AchievementItems/Founder';
import { Achievement, User } from '~/types';

export default function AchievementPass({
  uploader,
  achievement
}: {
  uploader: User;
  achievement: Achievement;
}) {
  const achievementComponentMap = {
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
        marginTop: '2.5rem',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        marginBottom: '-4rem'
      }}
    >
      {uploader.username}
      <Component key={achievement?.key} data={achievement} />
    </div>
  );
}
