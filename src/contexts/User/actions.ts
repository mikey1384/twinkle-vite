import { Dispatch } from '~/types';
import {
  DEFAULT_PROFILE_THEME,
  localStorageKeys
} from '~/constants/defaultValues';

export default function UserActions(dispatch: Dispatch) {
  return {
    onChangeDefaultSearchFilter(filter: string) {
      return dispatch({
        type: 'CHANGE_DEFAULT_FILTER',
        filter
      });
    },
    onClearUserSearch() {
      return dispatch({
        type: 'CLEAR_USER_SEARCH'
      });
    },
    onCloseSigninModal() {
      return dispatch({
        type: 'CLOSE_SIGNIN_MODAL'
      });
    },
    onInitMyState(data: object) {
      return dispatch({
        type: 'INIT_MY_STATE',
        data: data
      });
    },
    onLoadUsers(data: object) {
      return dispatch({
        type: 'LOAD_USERS',
        data
      });
    },
    onLoadMoreUsers(data: object) {
      return dispatch({
        type: 'LOAD_MORE_USERS',
        data
      });
    },
    onLogin(data: object) {
      return dispatch({
        type: 'LOGIN',
        data
      });
    },
    onLogout() {
      Object.keys(localStorageKeys).forEach((key) =>
        localStorage.removeItem(key)
      );
      localStorage.removeItem('token');
      localStorage.setItem('profileTheme', DEFAULT_PROFILE_THEME);
      return dispatch({
        type: 'LOGOUT'
      });
    },
    onOpenSigninModal() {
      return dispatch({
        type: 'OPEN_SIGNIN_MODAL'
      });
    },
    onSetAchievementsObj(achievementsObj: object) {
      return dispatch({
        type: 'SET_ACHIEVEMENTS_OBJ',
        achievementsObj
      });
    },
    onSetIsAchievementsLoaded(isAchievementsLoaded: boolean) {
      return dispatch({
        type: 'SET_IS_ACHIEVEMENTS_LOADED',
        isAchievementsLoaded
      });
    },
    onSearchUsers(users: any[]) {
      return dispatch({
        type: 'SEARCH_USERS',
        users
      });
    },
    onSignup(data: object) {
      return dispatch({
        type: 'SIGNUP',
        data
      });
    },
    onSetCollectType(type: string) {
      return dispatch({
        type: 'SET_COLLECT_TYPE',
        collectType: type
      });
    },
    onSetLastChatPath(lastChatPath: string) {
      return dispatch({
        type: 'SET_LAST_CHAT_PATH',
        lastChatPath
      });
    },
    onSetOrderUsersBy(label: string) {
      return dispatch({
        type: 'SET_ORDER_USERS_BY',
        label
      });
    },
    onSetAchievers({
      achievementId,
      achievers
    }: {
      achievementId: number;
      achievers: any[];
    }) {
      return dispatch({
        type: 'SET_ACHIEVERS',
        achievementId,
        achievers
      });
    },
    onSetProfilesLoaded(loaded: boolean) {
      return dispatch({
        type: 'SET_PROFILES_LOADED',
        loaded
      });
    },
    onSetSessionLoaded() {
      return dispatch({
        type: 'SET_SESSION_LOADED'
      });
    },
    onSetUserState({ userId, newState }: { userId: number; newState: object }) {
      return dispatch({
        type: 'SET_USER_STATE',
        userId,
        newState
      });
    },
    onToggleHideWatched(hideWatched: boolean) {
      return dispatch({
        type: 'TOGGLE_HIDE_WATCHED',
        hideWatched
      });
    },
    onToggleWordleStrictMode(strictMode: boolean) {
      return dispatch({
        type: 'TOGGLE_WORDLE_STRICT_MODE',
        strictMode
      });
    },
    onUpdateAchievementUnlockStatus({
      userId,
      achievementType,
      isUnlocked
    }: {
      userId: number;
      achievementType: string;
      isUnlocked: boolean;
    }) {
      return dispatch({
        type: 'UPDATE_ACHIEVEMENT_UNLOCK_STATUS',
        userId,
        achievementType,
        isUnlocked
      });
    },
    onUpdateAICardOfferCheckTimeStamp(timeStamp: number) {
      return dispatch({
        type: 'UPDATE_AI_CARD_OFFER_CHECK_TIMESTAMP',
        timeStamp
      });
    },
    onUpdateUserMissionState({
      missionType,
      newState
    }: {
      missionType: string;
      newState: object;
    }) {
      return dispatch({
        type: 'UPDATE_MISSION_STATE',
        missionType,
        newState
      });
    },
    onSetCommunityFunds(amount: number) {
      return dispatch({
        type: 'SET_COMMUNITY_FUNDS',
        amount
      });
    }
  };
}
