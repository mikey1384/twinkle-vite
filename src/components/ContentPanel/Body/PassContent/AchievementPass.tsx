import React from 'react';
import { User } from '~/types';

export default function AchievementPass({ uploader }: { uploader: User }) {
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
    </div>
  );
}
