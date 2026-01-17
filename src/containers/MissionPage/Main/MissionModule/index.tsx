import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import TakeScreenshot from './TakeScreenshot';
import CopyAndPaste from './CopyAndPaste';
import Googling from './Googling';
import Grammar from './Grammar';
import TwinkleStore from './TwinkleStore';
import Email from './Email';
import FixingBugs from './FixingBugs';
import GitHub from './GitHub';
import HelloWorld from './HelloWorld';
import Replit from './Replit';
import WriteItYourself from './WriteItYourself';
import LaunchTheWebsite from './LaunchTheWebsite';
import SystemPromptMission from './SystemPrompt';
import BuildMission from './Build';

export default function MissionModule({
  mission,
  isRepeating,
  onSetMissionState,
  style
}: {
  mission: any;
  isRepeating?: boolean;
  onSetMissionState: (v: any) => void;
  style?: React.CSSProperties;
}) {
  return (
    <ErrorBoundary componentPath={`MissionModule/${mission.missionType}`}>
      <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
        {mission.missionType === 'screenshot' && (
          <TakeScreenshot
            attachment={mission.attachment}
            missionId={mission.id}
          />
        )}
        {mission.missionType === 'username' && (
          <TwinkleStore mission={mission} />
        )}
        {mission.missionType === 'google' && (
          <Googling
            isDeprecated={Number(mission.isHidden) === 1}
            mission={mission}
            onSetMissionState={onSetMissionState}
          />
        )}
        {mission.missionType === 'system-prompt' && (
          <SystemPromptMission
            mission={mission}
            onSetMissionState={onSetMissionState}
          />
        )}
        {mission.missionType === 'build' && (
          <BuildMission mission={mission} />
        )}
        {mission.missionType === 'copy-and-paste' && (
          <CopyAndPaste
            mission={mission}
            onSetMissionState={onSetMissionState}
          />
        )}
        {mission.missionType === 'grammar' && (
          <Grammar mission={mission} isRepeating={isRepeating} />
        )}
        {mission.missionType === 'email' && <Email taskId={mission.id} />}
        {mission.missionType === 'github' && (
          <GitHub task={mission} onSetMissionState={onSetMissionState} />
        )}
        {mission.missionType === 'replit' && (
          <Replit task={mission} onSetMissionState={onSetMissionState} />
        )}
        {mission.missionType === 'hello-world' && (
          <HelloWorld task={mission} onSetMissionState={onSetMissionState} />
        )}
        {mission.missionType === 'fix-bugs' && (
          <FixingBugs task={mission} onSetMissionState={onSetMissionState} />
        )}
        {mission.missionType === 'write-it-yourself' && (
          <WriteItYourself
            task={mission}
            onSetMissionState={onSetMissionState}
          />
        )}
        {mission.missionType === 'launch-the-website' && (
          <LaunchTheWebsite
            isDeprecated={Number(mission.isHidden) === 1}
            task={mission}
            onSetMissionState={onSetMissionState}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
