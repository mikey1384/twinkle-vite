import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { borderRadius } from '~/constants/css';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';
import SubMission from './SubMission';

MultiMission.propTypes = {
  mission: PropTypes.object.isRequired,
  myAttempts: PropTypes.object.isRequired
};
export default function MultiMission({
  mission: { missionType, subMissions = [] },
  myAttempts
}: {
  mission: {
    missionType: string;
    subMissions?: any[];
  };
  myAttempts: {
    [key: string]: {
      status: string;
    };
  };
}) {
  const { managementLevel } = useKeyContext((v) => v.myState);
  const missionProgress = useMemo(() => {
    const result: { [key: string]: any } = {};
    for (let i = 0; i < subMissions.length; i++) {
      let passed = true;
      let currentTaskIndex = 0;
      const subMission = subMissions[i];
      for (let j = 0; j < subMission?.tasks?.length; j++) {
        const task = subMission.tasks[j];
        if (myAttempts[task.id]?.status !== 'pass') {
          passed = false;
          currentTaskIndex = j;
          break;
        }
      }
      result[i] = { passed, currentTaskIndex };
    }
    return result;
  }, [myAttempts, subMissions]);

  return (
    <div
      className={css`
        margin-top: 3rem;
        border-radius: ${borderRadius};
      `}
    >
      {subMissions.map((subMission, index) => (
        <SubMission
          key={index}
          index={index}
          isManager={managementLevel > 2}
          subMission={subMission}
          missionType={missionType}
          subMissionProgress={missionProgress[index]}
          previousSubmissionPassed={!!missionProgress[index - 1]?.passed}
        />
      ))}
    </div>
  );
}
