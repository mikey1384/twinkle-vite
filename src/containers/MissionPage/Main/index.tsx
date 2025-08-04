import React from 'react';
import Loading from '~/components/Loading';
import ErrorBoundary from '~/components/ErrorBoundary';
import MissionContainer from './MissionContainer';
import { Routes, Route } from 'react-router-dom';
import TaskContainer from './TaskContainer';

export default function Main({
  mission,
  onSetMissionState,
  style
}: {
  mission: any;
  onSetMissionState: (info: { missionId: number; newState: any }) => void;
  style?: React.CSSProperties;
}) {
  return (
    <ErrorBoundary
      componentPath="MissionPage/Main/index"
      style={{
        width: '100%',
        ...style
      }}
    >
      {mission ? (
        <Routes>
          <Route
            path={`/:taskType`}
            element={<TaskContainer mission={mission} />}
          />
          <Route
            path="/"
            element={
              <MissionContainer
                mission={mission}
                onSetMissionState={onSetMissionState}
              />
            }
          />
        </Routes>
      ) : (
        <Loading text="Loading Mission..." />
      )}
    </ErrorBoundary>
  );
}
