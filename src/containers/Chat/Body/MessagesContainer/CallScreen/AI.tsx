import React, { useMemo } from 'react';
import ProfilePic from '~/components/ProfilePic';
import { useNotiContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

interface AiUsagePolicy {
  energyPercent?: number;
  energySegments?: number;
  energySegmentsRemaining?: number;
}

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
  const userId = useKeyContext((v) => v.myState.userId);
  const isAdmin = useKeyContext((v) => v.myState.isAdmin);
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const aiUsagePolicy = todayStats?.aiUsagePolicy as AiUsagePolicy | null;

  const batteryLevel = useMemo(() => {
    if (isAdmin) return 100;
    return Math.max(0, Math.min(100, aiUsagePolicy?.energyPercent ?? 100));
  }, [aiUsagePolicy?.energyPercent, isAdmin]);

  const energySegments = useMemo(() => {
    return Math.max(1, aiUsagePolicy?.energySegments || 5);
  }, [aiUsagePolicy?.energySegments]);

  const energySegmentsRemaining = useMemo(() => {
    if (isAdmin) return energySegments;
    return Math.max(
      0,
      Math.min(
        energySegments,
        aiUsagePolicy?.energySegmentsRemaining ??
          Math.ceil((batteryLevel / 100) * energySegments)
      )
    );
  }, [
    aiUsagePolicy?.energySegmentsRemaining,
    batteryLevel,
    energySegments,
    isAdmin
  ]);

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
            display: flex;
            gap: 4px;
          `}
        >
          {Array.from({ length: energySegments }).map((_, index) => (
            <span
              key={index}
              className={css`
                flex: 1;
                height: 100%;
                background-color: ${index < energySegmentsRemaining
                  ? '#4caf50'
                  : 'rgba(255, 255, 255, 0.6)'};
                border-radius: 15px;
                transition: background-color 0.3s ease-in-out;
              `}
            />
          ))}
        </div>
        <div
          className={css`
            margin-top: 0.5rem;
            font-size: 0.9rem;
            color: #555;
          `}
        >
          AI Energy: {batteryLevel}%
        </div>
      </div>
    </div>
  );
}
