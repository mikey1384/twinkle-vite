import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import ExerciseContainer from '../components/ExerciseContainer';
import exercises from './exercises';
import TaskComplete from '../components/TaskComplete';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

FixingBugs.propTypes = {
  task: PropTypes.object.isRequired,
  onSetMissionState: PropTypes.func.isRequired
};

const exerciseKeys = Object.keys(exercises);

export default function FixingBugs({
  task,
  onSetMissionState
}: {
  task: any;
  onSetMissionState: (arg0: { missionId: any; newState: any }) => void;
}) {
  const { codeObj = {} } = task;
  const missions = useKeyContext((v) => v.myState.missions);
  const allPassed = useMemo(() => {
    let passed = true;
    for (const key of exerciseKeys) {
      if (missions[task.missionType]?.[key] !== 'pass') {
        passed = false;
        break;
      }
    }
    return passed;
  }, [missions, task.missionType]);

  return (
    <ErrorBoundary
      componentPath="MissionModule/FixingBugs/index"
      className={css`
        width: 100%;
        font-size: 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        p {
          font-size: 2rem;
          font-weight: bold;
        }
      `}
    >
      {exerciseKeys.map((exerciseKey, index) => (
        <ExerciseContainer
          key={exerciseKey}
          exercises={exercises}
          index={index}
          exerciseKey={exerciseKey}
          prevExerciseKey={index === 0 ? '' : exerciseKeys[index - 1]}
          codeObj={codeObj}
          onSetCode={({
            code,
            exerciseLabel
          }: {
            code: string;
            exerciseLabel: string;
          }) =>
            onSetMissionState({
              missionId: task.id,
              newState: { codeObj: { ...codeObj, [exerciseLabel]: code } }
            })
          }
          onOpenTutorial={() =>
            onSetMissionState({
              missionId: task.id,
              newState: { tutorialStarted: true }
            })
          }
          taskType={task.missionType}
          prevUserId={task.prevUserId}
          style={{ marginTop: index === 0 ? 0 : '10rem' }}
        />
      ))}
      {allPassed && (
        <TaskComplete
          style={{ marginTop: '10rem' }}
          taskId={task.id}
          passMessage="You made it!"
          passMessageFontSize="2.2rem"
        />
      )}
    </ErrorBoundary>
  );
}
