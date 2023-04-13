import React, { useReducer, ReactNode } from 'react';
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
  return (
    <MissionContext.Provider
      value={{
        state: missionState,
        actions: MissionActions(missionDispatch)
      }}
    >
      {children}
    </MissionContext.Provider>
  );
}
