import { useReducer } from 'react';
import { createContext } from 'use-context-selector';
import PropTypes from 'prop-types';
import MissionActions from './actions';
import MissionReducer from './reducer';

export const MissionContext = createContext();
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

MissionContextProvider.propTypes = {
  children: PropTypes.node
};

export function MissionContextProvider({ children }) {
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
