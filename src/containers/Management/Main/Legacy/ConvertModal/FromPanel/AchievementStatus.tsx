import React from 'react';
import Loading from '~/components/Loading';
import AchievementItem from '~/components/AchievementItem';
import { Content } from '~/types';

export default function AchievementStatus({
  achievements,
  loading
}: {
  achievements: Content[];
  loading: boolean;
}) {
  return loading ? (
    <Loading />
  ) : (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {achievements.map((achievement: Content) => (
        <div style={{ flex: '0 0 50%' }} key={achievement.id}>
          <AchievementItem isSmall achievement={achievement} />
        </div>
      ))}
    </div>
  );
}
