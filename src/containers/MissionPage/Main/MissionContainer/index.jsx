import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Mission from './Mission';
import Tutorial from '../Tutorial';
import RepeatMissionAddons from '../RepeatMissionAddons';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import TutorialModal from '../TutorialModal';

MissionContainer.propTypes = {
  mission: PropTypes.object.isRequired,
  myAttempts: PropTypes.object.isRequired,
  onSetMissionState: PropTypes.func.isRequired
};

export default function MissionContainer({
  mission,
  myAttempts,
  onSetMissionState
}) {
  const isRepeatMission = useMemo(() => {
    const repeatMissionTypes = ['grammar'];
    return repeatMissionTypes.includes(mission.missionType);
  }, [mission.missionType]);

  return (
    <div style={{ width: '100%' }}>
      <Mission
        style={{ width: '100%' }}
        mission={mission}
        onSetMissionState={onSetMissionState}
      />
      {isRepeatMission ? (
        <RepeatMissionAddons
          mission={mission}
          onSetMissionState={onSetMissionState}
        />
      ) : (
        <Tutorial
          mission={mission}
          myAttempts={myAttempts}
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
