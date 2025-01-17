import React, { useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import AddTutorial from './AddTutorial';
import ViewTutorial from './ViewTutorial';
import InteractiveContent from '~/components/InteractiveContent';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useMissionContext, useKeyContext } from '~/contexts';
import { scrollElementTo, scrollElementToCenter } from '~/helpers';

Tutorial.propTypes = {
  onSetMissionState: PropTypes.func,
  className: PropTypes.string,
  style: PropTypes.object,
  mission: PropTypes.object.isRequired,
  innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
};

export default function Tutorial({
  className,
  onSetMissionState,
  style,
  mission,
  innerRef
}: {
  onSetMissionState: (info: { missionId: number; newState: any }) => void;
  className?: string;
  style?: React.CSSProperties;
  mission: any;
  innerRef?: React.RefObject<any>;
}) {
  const { managementLevel } = useKeyContext((v) => v.myState);
  const myAttempts = useMissionContext((v) => v.state.myAttempts);
  const canEditTutorial = useMemo(() => managementLevel > 2, [managementLevel]);
  const divToCenter = useRef(null);
  const myAttempt = useMemo(
    () => myAttempts[mission.id],
    [mission.id, myAttempts]
  );
  const tutorialButtonShownForNonManager = useMemo(
    () => mission.tutorialIsPublished && myAttempt?.status !== 'pass',
    [mission.tutorialIsPublished, myAttempt?.status]
  );

  return (
    <ErrorBoundary
      componentPath="MissionPage/Main/Tutorial"
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        ...style
      }}
    >
      <div ref={innerRef} />
      <div ref={divToCenter} />
      {canEditTutorial && !mission.tutorialId && (
        <AddTutorial missionId={mission.id} missionTitle={mission.title} />
      )}
      {!!mission.tutorialId &&
        (canEditTutorial || tutorialButtonShownForNonManager) && (
          <ViewTutorial
            canEditTutorial={canEditTutorial}
            missionId={mission.id}
            style={canEditTutorial ? { marginBottom: '5rem' } : {}}
            onSetMissionState={onSetMissionState}
            tutorialPrompt={mission.tutorialPrompt}
            tutorialButtonLabel={mission.tutorialButtonLabel}
            onStartClick={() =>
              onSetMissionState({
                missionId: mission.id,
                newState: { tutorialStarted: true }
              })
            }
          />
        )}
      {!!mission.tutorialId &&
        (canEditTutorial || myAttempt?.status === 'pass') && (
          <InteractiveContent
            onScrollElementTo={scrollElementTo}
            onScrollElementToCenter={scrollElementToCenter}
            interactiveId={mission.tutorialId}
            onGoBackToMission={handleGoBackToMission}
          />
        )}
    </ErrorBoundary>
  );

  function handleGoBackToMission() {
    scrollElementToCenter(divToCenter.current);
    onSetMissionState({
      missionId: mission.id,
      newState: { tutorialStarted: false }
    });
  }
}
