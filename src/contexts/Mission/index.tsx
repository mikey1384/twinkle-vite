import React, { useReducer, ReactNode, useMemo } from 'react';
import { createContext } from 'use-context-selector';
import MissionActions from './actions';
import MissionReducer from './reducer';

export const MissionContext = createContext({});
export const initialMissionState = {
  missions: [],
  pendingLoadMoreButton: false,
  passLoadMoreButton: false,
  failLoadMoreButton: false,
  attemptObj: {},
  managementObj: {},
  missionObj: {},
  myAttempts: {},
  prevUserId: null,
  selectedManagementTab: 'pending',
  selectedMissionsTab: 'missions',
  selectedMissionListTab: ''
};

export function MissionContextProvider({ children }: { children: ReactNode }) {
  const [missionState, missionDispatch] = useReducer(
    MissionReducer,
    initialMissionState
  );
  const memoizedActions = useMemo(
    () => MissionActions(missionDispatch),
    [missionDispatch]
  );
  return (
    <MissionContext.Provider
      value={{
        state: missionState,
        actions: memoizedActions
      }}
    >
      {children}
    </MissionContext.Provider>
  );
}
