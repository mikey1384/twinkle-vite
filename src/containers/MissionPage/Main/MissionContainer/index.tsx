import React, { useMemo } from 'react';
import Mission from './Mission';
import Tutorial from '../Tutorial';
import RepeatMissionAddons from '../RepeatMissionAddons';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import TutorialModal from '../TutorialModal';

export default function MissionContainer({
  mission,
  onSetMissionState
}: {
  mission: any;
  onSetMissionState: (arg0: any) => void;
}) {
  const isRepeatMission = useMemo(() => {
    const repeatMissionTypes = ['grammar'];
    return repeatMissionTypes.includes(mission.missionType);
  }, [mission.missionType]);

  return (
    <div
      data-scroll-anchor-id={`mission-detail:${mission.id || mission.missionType}:page`}
      data-scroll-anchor-content-key={`mission:${mission.missionType || mission.id}:page`}
      style={{ width: '100%' }}
    >
      <div
        data-scroll-anchor-id={`mission-detail:${mission.id || mission.missionType}:mission`}
        data-scroll-anchor-content-key={`mission:${mission.missionType || mission.id}:mission`}
      >
        <Mission
          style={{ width: '100%' }}
          mission={mission}
          onSetMissionState={onSetMissionState}
        />
      </div>
      {isRepeatMission ? (
        <div
          data-scroll-anchor-id={`mission-detail:${mission.id || mission.missionType}:repeat-addons`}
          data-scroll-anchor-content-key={`mission:${mission.missionType || mission.id}:repeat-addons`}
        >
          <RepeatMissionAddons
            mission={mission}
            onSetMissionState={onSetMissionState}
          />
        </div>
      ) : (
        <div
          data-scroll-anchor-id={`mission-detail:${mission.id || mission.missionType}:tutorial`}
          data-scroll-anchor-content-key={`mission:${mission.missionType || mission.id}:tutorial`}
        >
          <Tutorial
            mission={mission}
            className={css`
              margin-top: 5rem;
              margin-bottom: 1rem;
              width: 100%;
              @media (max-width: ${mobileMaxWidth}) {
                margin-top: 2rem;
              }
            `}
            onSetMissionState={onSetMissionState}
          />
        </div>
      )}
      {mission.tutorialStarted && (
        <TutorialModal
          missionTitle={mission.title}
          tutorialId={mission.tutorialId}
          tutorialSlideId={mission.tutorialSlideId}
          onCurrentSlideIdChange={(slideId) =>
            onSetMissionState({
              missionId: mission.id,
              newState: { tutorialSlideId: slideId }
            })
          }
          onHide={() =>
            onSetMissionState({
              missionId: mission.id,
              newState: { tutorialStarted: false }
            })
          }
        />
      )}
    </div>
  );
}
