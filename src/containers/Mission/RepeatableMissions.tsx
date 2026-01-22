import React, { useMemo } from 'react';
import MissionItem from '~/components/MissionItem';
import { css } from '@emotion/css';

export default function RepeatableMissions({
  className,
  repeatableMissions,
  style
}: {
  className?: string;
  repeatableMissions: { id: number; missionType: string }[];
  style?: React.CSSProperties;
}) {
  const repeatableMissionsLabel = useMemo(() => {
    return `Pinned Mission${repeatableMissions.length > 1 ? 's' : ''}`;
  }, [repeatableMissions.length]);

  return (
    <div className={className} style={style}>
      <p
        className={css`
          font-size: 2.5rem;
          font-weight: bold;
        `}
      >
        {repeatableMissionsLabel}
      </p>
      <div>
        {repeatableMissions.map((mission) => (
          <MissionItem
            key={mission.id}
            isRepeatable
            style={{ marginTop: '1rem' }}
            mission={mission}
            missionLink={`/missions/${mission.missionType}`}
            showStatus={false}
          />
        ))}
      </div>
    </div>
  );
}
