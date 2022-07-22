import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import MissionItem from '~/components/MissionItem';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

SubMission.propTypes = {
  index: PropTypes.number,
  isManager: PropTypes.bool,
  subMission: PropTypes.object.isRequired,
  missionType: PropTypes.string.isRequired,
  previousSubmissionPassed: PropTypes.bool,
  subMissionProgress: PropTypes.object
};

export default function SubMission({
  index,
  isManager,
  subMission,
  missionType,
  previousSubmissionPassed,
  subMissionProgress
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
