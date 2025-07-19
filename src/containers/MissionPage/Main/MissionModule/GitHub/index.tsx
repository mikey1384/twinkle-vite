import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import GitHubVerifier from './GitHubVerifier';
import TaskComplete from '../components/TaskComplete';
import { useKeyContext } from '~/contexts';

GitHub.propTypes = {
  onSetMissionState: PropTypes.func.isRequired,
  task: PropTypes.object.isRequired
};

export default function GitHub({
  onSetMissionState,
  task
}: {
  onSetMissionState: (arg0: { missionId: any; newState: any }) => void;
  task: any;
}) {
  const githubUsername = useKeyContext((v) => v.myState.githubUsername);
  const conditionPassed = useMemo(() => !!githubUsername, [githubUsername]);

  return (
    <ErrorBoundary
      componentPath="MissionModule/GitHub/index"
      style={{ width: '100%' }}
    >
      {conditionPassed ? (
        <TaskComplete
          taskId={task.id}
          passMessage="Great job creating your GitHub account!"
        />
      ) : (
        <GitHubVerifier task={task} onSetMissionState={onSetMissionState} />
      )}
    </ErrorBoundary>
  );
}
