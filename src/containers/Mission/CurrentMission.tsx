import React, { useMemo } from 'react';
import MissionItem from '~/components/MissionItem';
import AskAgentButton from '~/components/Buttons/AskAgentButton';
import { css } from '@emotion/css';
import { useMissionContext } from '~/contexts';
const currentMissionLabel = 'Current Mission';

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
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        `}
      >
        <p
          className={css`
            font-size: 2.5rem;
            font-weight: bold;
          `}
        >
          {currentMissionLabel}
        </p>
        {mission.id ? (
          <AskAgentButton
            label="Help me with this"
            context={{
              kind: 'mission',
              id: Number(mission.id),
              label: mission.title
                ? `the "${mission.title}" mission`
                : 'this mission'
            }}
          />
        ) : null}
      </div>
      <MissionItem
        showStatus={false}
        style={{ marginTop: '1rem' }}
        mission={mission}
        missionLink={`/missions/${mission.missionType}`}
      />
    </div>
  );
}
