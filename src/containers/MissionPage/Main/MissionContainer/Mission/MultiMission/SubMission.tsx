import React, { useMemo } from 'react';
import MissionItem from '~/components/MissionItem';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function SubMission({
  index,
  isManager,
  subMission,
  missionType,
  previousSubmissionPassed,
  subMissionProgress
}: {
  index: number;
  isManager: boolean;
  subMission: {
    title: string;
    tasks: any[];
  };
  missionType: string;
  previousSubmissionPassed: boolean;
  subMissionProgress: {
    passed: boolean;
    currentTaskIndex: number;
  };
}) {
  const subMissionIsLocked = useMemo(
    () => index !== 0 && !previousSubmissionPassed && !isManager,
    [index, previousSubmissionPassed, isManager]
  );
  return (
    <div
      style={{
        marginTop: index === 0 ? 0 : '3rem'
      }}
    >
      <p
        className={css`
          font-weight: bold;
          font-size: 2.5rem;
          margin-bottom: 1rem;
          opacity: ${index === 0 ? 1 : subMissionIsLocked ? 0.2 : 1};
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 2.1rem;
          }
        `}
      >
        {index + 1}. {subMission.title}
      </p>
      <div>
        {subMission?.tasks?.map((task, index) => {
          const taskIsLocked =
            index !== 0 &&
            !isManager &&
            !subMissionProgress.passed &&
            index > subMissionProgress.currentTaskIndex;
          return (
            <MissionItem
              key={task.id}
              locked={subMissionIsLocked || taskIsLocked}
              style={{
                marginTop: index === 0 ? 0 : '1rem'
              }}
              missionLink={`/missions/${missionType}/${task.missionType}`}
              mission={task}
            />
          );
        })}
      </div>
    </div>
  );
}
