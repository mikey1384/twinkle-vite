import React from 'react';
import { User } from '~/types';

export default function AchievementPass({
  uploader,
  achievement
}: {
  uploader: User;
  achievement: any;
}) {
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
      {achievement.id}
    </div>
  );
}
