import React, { useMemo } from 'react';
import ProfilePic from '~/components/ProfilePic';
import { useNotiContext, useKeyContext } from '~/contexts';
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
  const { userId, isAdmin } = useKeyContext((v) => v.myState);
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const aiCallDuration = useMemo(() => {
    if (!todayStats) return 0;
    return todayStats.aiCallDuration;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStats?.aiCallDuration]);

  const batteryLevel = useMemo(() => {
    if (isAdmin) return 100;
    return Math.round(((60 - aiCallDuration) / 60) * 100);
  }, [aiCallDuration, isAdmin]);

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
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            marginBottom: '2rem'
          }}
        >
          <div style={{ marginRight: '1.5rem' }}>
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
        <div
          className={css`
            width: 200px;
            height: 40px;
            background-color: #e0e0e0;
            border-radius: 20px;
            padding: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          `}
        >
          <div
            className={css`
              height: 100%;
              width: ${batteryLevel}%;
              background-color: #4caf50;
              border-radius: 15px;
              transition: width 0.3s ease-in-out;
            `}
          />
        </div>
        <div
          className={css`
            margin-top: 0.5rem;
            font-size: 0.9rem;
            color: #555;
          `}
        >
          AI Power: {batteryLevel}%
        </div>
      </div>
    </div>
  );
}
