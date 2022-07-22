import React from 'react';
import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import ErrorBoundary from '~/components/ErrorBoundary';
import MissionContainer from './MissionContainer';
import { Routes, Route } from 'react-router-dom';
import TaskContainer from './TaskContainer';

Main.propTypes = {
  mission: PropTypes.object.isRequired,
  myAttempts: PropTypes.object.isRequired,
  onSetMissionState: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default function Main({
  mission,
  myAttempts,
  onSetMissionState,
  style
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
                myAttempts={myAttempts}
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
