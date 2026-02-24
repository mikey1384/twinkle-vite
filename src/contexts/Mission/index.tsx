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
  selectedMissionListTab: '',
  sharedPrompts: [] as any[],
  sharedPromptsLoaded: false,
  sharedPromptsLoadMoreButton: false,
  sharedPromptsSortBy: 'new' as 'new' | 'cloned' | 'used' | 'mine'
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
  const contextValue = useMemo(
    () => ({ state: missionState, actions: memoizedActions }),
    [missionState, memoizedActions]
  );
  return (
    <MissionContext.Provider value={contextValue}>
      {children}
    </MissionContext.Provider>
  );
}
