import React, { useMemo } from 'react';
import MissionItem from '~/components/MissionItem';
import { css } from '@emotion/css';
import { useMissionContext } from '~/contexts';
import localize from '~/constants/localize';

const currentMissionLabel = localize('currentMission');

export default function CurrentMission({
  style,
  missionId
}: {
  style?: React.CSSProperties;
  missionId: number;
}) {
  const missionObj = useMissionContext((v) => v.state.missionObj);
  const mission = useMemo(
    () => missionObj[missionId] || {},
    [missionId, missionObj]
  );

  return (
    <div style={style}>
      <p
        className={css`
          font-size: 2.5rem;
          font-weight: bold;
        `}
      >
        {currentMissionLabel}
      </p>
      <MissionItem
        showStatus={false}
        style={{ marginTop: '1rem' }}
        mission={mission}
        missionLink={`/missions/${mission.missionType}`}
      />
    </div>
  );
}
