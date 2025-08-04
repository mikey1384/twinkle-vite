import React from 'react';
import UserView from './UserView';
import CreatorView from './CreatorView';
import { panel } from '../../../Styles';

export default function ViewTutorial({
  canEditTutorial,
  missionId,
  onStartClick,
  onSetMissionState,
  style,
  tutorialPrompt,
  tutorialButtonLabel
}: {
  canEditTutorial?: boolean;
  missionId: number;
  onStartClick: () => void;
  onSetMissionState: (info: { missionId: number; newState: any }) => void;
  style?: React.CSSProperties;
  tutorialPrompt?: string;
  tutorialButtonLabel?: string;
}) {
  return (
    <div
      className={panel}
      style={{
        padding: '2rem',
        width: '100%',
        ...style
      }}
    >
      {canEditTutorial ? (
        <CreatorView
          missionId={missionId}
          onSetMissionState={onSetMissionState}
          tutorialPrompt={tutorialPrompt}
          tutorialButtonLabel={tutorialButtonLabel}
        />
      ) : (
        <UserView
          tutorialPrompt={tutorialPrompt}
          tutorialButtonLabel={tutorialButtonLabel}
          onStartClick={onStartClick}
        />
      )}
    </div>
  );
}
