import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import MultiStepContainer from '../components/MultiStepContainer';
import LetsLaunch from './LetsLaunch';
import MakeAccount from './MakeAccount';
import FinalizeYourCode from './FinalizeYourCode';
import ConnectReplToGitHub from './ConnectReplToGitHub';
import UpdateYourRepl from './UpdateYourRepl';
import defaultCode from './defaultCode';
import RequiresComputer from '../components/RequiresComputer';
import { useAppContext, useKeyContext } from '~/contexts';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

export default function LaunchTheWebsite({
  onSetMissionState,
  style,
  task
}: {
  onSetMissionState: (v: any) => void;
  style?: React.CSSProperties;
  task: any;
}) {
  const missions = useKeyContext((v) => v.myState.missions);
  const username = useKeyContext((v) => v.myState.username);
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const updateMissionStatus = useAppContext(
    (v) => v.requestHelpers.updateMissionStatus
  );
  const onUpdateUserMissionState = useAppContext(
    (v) => v.user.actions.onUpdateUserMissionState
  );
  const taskState = useMemo(
    () => missions[task?.missionType] || {},
    [missions, task?.missionType]
  );
  const { makeAccountOkayPressed, connectReplToGitHubOkayPressed } = taskState;
  const FirstButton = useMemo(() => {
    return {
      label: 'Save and move on',
      color: doneColor,
      variant: 'soft',
      tone: 'raised',
      onClick: async (onNext: () => void) => {
        await handleSaveCode(taskState.code);
        onNext();
      }
    };

    async function handleSaveCode(code: string) {
      await updateMissionStatus({
        missionType: task.missionType,
        newStatus: { code }
      });
    }
  }, [doneColor, task.missionType, taskState.code, updateMissionStatus]);

  const SecondButton = useMemo(() => {
    if (!makeAccountOkayPressed) {
      return {
        label: 'Okay',
        color: 'logoBlue',
        noArrow: true,
        variant: 'soft',
        tone: 'raised',
        onClick: () => {
          window.open('https://vercel.com');
          setTimeout(
            () => handleUpdateTaskProgress({ makeAccountOkayPressed: true }),
            1000
          );
        }
      };
    }
    return {
      label: 'I made an account',
      color: 'green',
      variant: 'soft',
      tone: 'raised'
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [makeAccountOkayPressed, task.id]);

  const FourthButton = useMemo(() => {
    if (!connectReplToGitHubOkayPressed) {
      return {
        label: 'Okay',
        color: 'logoBlue',
        noArrow: true,
        disabled: deviceIsMobile,
        variant: 'soft',
        tone: 'raised',
        onClick: () =>
          handleUpdateTaskProgress({ connectReplToGitHubOkayPressed: true })
      };
    }
    return {
      label: 'Yes',
      color: 'green',
      disabled: deviceIsMobile,
      variant: 'soft',
      tone: 'raised'
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectReplToGitHubOkayPressed, task.id]);
  const code = useMemo(
    () => taskState.code || defaultCode({ username }),
    [taskState.code, username]
  );

  return (
    <ErrorBoundary
      componentPath="MissionModule/LaunchTheWebsite/index"
      style={style}
    >
      <MultiStepContainer
        buttons={[
          FirstButton,
          SecondButton,
          {
            label: 'Yes I did',
            color: 'green',
            variant: 'soft',
            tone: 'raised',
            disabled: deviceIsMobile
          },
          FourthButton
        ]}
        taskId={task.id}
        taskType={task.missionType}
        onOpenTutorial={() =>
          onSetMissionState({
            missionId: task.id,
            newState: { tutorialStarted: true }
          })
        }
      >
        <FinalizeYourCode
          code={taskState.code}
          onSetCode={handleSetCode}
          task={task}
          username={username}
        />
        <MakeAccount
          onSetOkayPressed={() =>
            handleUpdateTaskProgress({ makeAccountOkayPressed: true })
          }
          okayPressed={makeAccountOkayPressed}
        />
        <RequiresComputer>
          <UpdateYourRepl code={code} />
        </RequiresComputer>
        <RequiresComputer>
          <ConnectReplToGitHub
            taskType={task.missionType}
            onOpenTutorial={() =>
              onSetMissionState({
                missionId: task.id,
                newState: { tutorialStarted: true }
              })
            }
            okayPressed={connectReplToGitHubOkayPressed}
          />
        </RequiresComputer>
        <LetsLaunch taskId={task.id} />
      </MultiStepContainer>
    </ErrorBoundary>
  );

  function handleSetCode(code: string) {
    onUpdateUserMissionState({
      missionType: task.missionType,
      newState: { code }
    });
  }

  async function handleUpdateTaskProgress(newState: any) {
    await updateMissionStatus({
      missionType: task.missionType,
      newStatus: newState
    });
    onUpdateUserMissionState({
      missionType: task.missionType,
      newState
    });
  }
}
