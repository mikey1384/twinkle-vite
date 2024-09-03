import { Dispatch } from '~/types';

export default function MissionActions(dispatch: Dispatch) {
  return {
    onLoadMission({
      mission,
      prevUserId
    }: {
      mission: object;
      prevUserId: number;
    }) {
      dispatch({
        type: 'LOAD_MISSION',
        mission,
        prevUserId
      });
    },
    onLoadMissionList({
      missions,
      myAttempts,
      loadMoreButton,
      prevUserId
    }: {
      missions: object[];
      myAttempts: object[];
      loadMoreButton: boolean;
      prevUserId: number;
    }) {
      dispatch({
        type: 'LOAD_MISSION_LIST',
        missions,
        loadMoreButton,
        myAttempts,
        prevUserId
      });
    },
    onLoadMissionTypeIdHash(hash: string) {
      dispatch({
        type: 'LOAD_MISSION_TYPE_ID_HASH',
        hash
      });
    },
    onSetAttemptObj(attemptObj: object) {
      dispatch({
        type: 'SET_ATTEMPT_OBJ',
        attemptObj
      });
    },
    onSetManagementObj(managementObj: object) {
      dispatch({
        type: 'SET_MANAGEMENT_OBJ',
        managementObj
      });
    },
    onSetSelectedManagementTab(selectedTab: string) {
      dispatch({
        type: 'SET_SELECTED_MANAGEMENT_TAB',
        selectedTab
      });
    },
    onSetSelectedMissionsTab(selectedTab: string) {
      dispatch({
        type: 'SET_SELECTED_MISSIONS_TAB',
        selectedTab
      });
    },
    onSetSelectedMissionListTab(selectedTab: string) {
      dispatch({
        type: 'SET_SELECTED_MISSION_LIST_TAB',
        selectedTab
      });
    },
    onSetMissionState({
      missionId,
      newState
    }: {
      missionId: number;
      newState: object;
    }) {
      dispatch({
        type: 'SET_MISSION_STATE',
        missionId,
        newState
      });
    },
    onSetMissionAttempt({
      missionId,
      attempt
    }: {
      missionId: number;
      attempt: object;
    }) {
      dispatch({
        type: 'SET_MISSION_ATTEMPT',
        missionId,
        attempt
      });
    },
    onSetMyMissionAttempts(myAttempts: object) {
      dispatch({
        type: 'SET_MY_MISSION_ATTEMPTS',
        myAttempts
      });
    },
    onUpdateMissionAttempt({
      missionId,
      newState
    }: {
      missionId: number;
      newState: object;
    }) {
      dispatch({
        type: 'UPDATE_MISSION_ATTEMPT',
        missionId,
        newState
      });
    }
  };
}
