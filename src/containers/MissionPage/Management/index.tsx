import React from 'react';
import PropTypes from 'prop-types';
import Main from './Main';
import InvalidPage from '~/components/InvalidPage';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import GrammarManager from './GrammarManager';
import { useKeyContext } from '~/contexts';

Management.propTypes = {
  mission: PropTypes.object,
  missionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onSetMissionState: PropTypes.func.isRequired
};

export default function Management({
  mission,
  missionId,
  onSetMissionState
}: {
  mission: any;
  missionId: number;
  onSetMissionState: (arg0: any) => void;
}) {
  const isAdmin = useKeyContext((v) => v.myState.isAdmin);
  if (!isAdmin) {
    return (
      <InvalidPage
        title="For moderators only"
        text="You are not authorized to view this page"
      />
    );
  }

  if (!mission?.missionType) {
    return <Loading />;
  }

  return (
    <ErrorBoundary
      componentPath="MissionPage/Management/index"
      style={{ width: '100%', marginBottom: '10rem' }}
    >
      {mission.missionType !== 'grammar' && (
        <Main
          mission={mission}
          missionId={missionId}
          missionType={mission.missionType}
          onSetMissionState={onSetMissionState}
        />
      )}
      {mission.missionType === 'grammar' && (
        <GrammarManager
          mission={mission}
          onSetMissionState={onSetMissionState}
        />
      )}
    </ErrorBoundary>
  );
}
