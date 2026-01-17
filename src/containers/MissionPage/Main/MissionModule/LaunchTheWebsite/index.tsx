import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
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
import { Color, borderRadius } from '~/constants/css';

const deviceIsMobile = isMobile(navigator);

export default function LaunchTheWebsite({
  isDeprecated = false,
  onSetMissionState,
  style,
  task
}: {
  isDeprecated?: boolean;
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
  const firstButton = {
    label: 'Save and move on',
    color: doneColor,
    variant: 'soft',
    tone: 'raised',
    onClick: async (onNext: () => void) => {
      await handleSaveCode(taskState.code);
      onNext();
    }
  };

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
      {isDeprecated && (
        <div
          style={{
            background: Color.darkerGray(0.9),
            border: `1px solid ${Color.darkerGray()}`,
            borderRadius,
            color: '#fff',
            fontSize: '1.5rem',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
            padding: '2rem',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.7rem',
              marginBottom: '1rem'
            }}
          >
            <Icon icon="archive" style={{ fontSize: '1.8rem' }} />
            <strong style={{ fontSize: '1.8rem' }}>Legacy Mission</strong>
          </div>
          <div style={{ opacity: 0.9 }}>
            This mission is no longer available for completion.
          </div>
        </div>
      )}
      <div
        style={
          isDeprecated
            ? { opacity: 0.6, pointerEvents: 'none' }
            : undefined
        }
      >
        <MultiStepContainer
          buttons={[
            firstButton,
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
      </div>
    </ErrorBoundary>
  );

  async function handleSaveCode(code: string) {
    await updateMissionStatus({
      missionType: task.missionType,
      newStatus: { code }
    });
  }

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
