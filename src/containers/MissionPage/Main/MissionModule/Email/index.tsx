import React, { useMemo } from 'react';
import EmailVerifier from './EmailVerifier';
import TaskComplete from '../components/TaskComplete';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useKeyContext } from '~/contexts';

export default function Email({ taskId }: { taskId: number }) {
  const { verifiedEmail, emailMissionAttempted } = useKeyContext(
    (v) => v.myState
  );
  const conditionPassed = useMemo(() => !!verifiedEmail, [verifiedEmail]);
  const passMessage = useMemo(
    () =>
      emailMissionAttempted
        ? 'Congratulations on successfully setting up your own email address!'
        : `It looks like you already have an email address!`,
    [emailMissionAttempted]
  );

  return (
    <ErrorBoundary
      componentPath="MissionModule/Email"
      style={{ width: '100%' }}
    >
      {conditionPassed ? (
        <TaskComplete taskId={taskId} passMessage={passMessage} />
      ) : (
        <EmailVerifier />
      )}
    </ErrorBoundary>
  );
}
