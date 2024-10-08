import React from 'react';
import ProfilePic from '~/components/ProfilePic';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

export default function CallScreen({
  style,
  partner
}: {
  style?: React.CSSProperties;
  partner: {
    id: number;
    profilePicUrl: string;
  };
}) {
  const { userId } = useKeyContext((v) => v.myState);
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        zIndex: 5,
        ...style
      }}
    >
      <div
        style={{
          display: 'flex',
          height: 'CALC(70% - 1rem)',
          justifyContent: 'center',
          alignItems: 'flex-end'
        }}
      >
        <div style={{ marginLeft: '1.5rem' }}>
          <ProfilePic
            className={css`
              width: 10rem;
            `}
            userId={userId}
          />
        </div>
        <div style={{ marginLeft: '1.5rem' }}>
          <ProfilePic
            className={css`
              width: 10rem;
            `}
            userId={partner.id}
            profilePicUrl={partner.profilePicUrl}
          />
        </div>
      </div>
    </div>
  );
}
