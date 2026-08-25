import { initialMyState } from '../AppContext';
import {
  achievementTypeToId,
  achievementIdToType
} from '~/constants/defaultValues';
import { applyCanonicalUserProfileStatePatch } from './profileState';

function normalizeCommunityFundsState(data: { [key: string]: any } | null) {
  if (!data) return data;
  if (Object.prototype.hasOwnProperty.call(data, 'communityFundsLoaded')) {
    return data;
  }
  if (Object.prototype.hasOwnProperty.call(data, 'communityFunds')) {
    return {
      ...data,
      communityFundsLoaded: true
    };
  }
  return data;
}

function preservePrivateViewerState({
  newState,
  prevState
}: {
  newState: { [key: string]: any } | null;
  prevState: { [key: string]: any };
}) {
  const incomingState = newState?.state;
  const hasIncomingState = Object.prototype.hasOwnProperty.call(
    newState || {},
    'state'
  );
  if (
    !hasIncomingState ||
    (incomingState &&
      typeof incomingState === 'object' &&
      !Array.isArray(incomingState) &&
      Object.prototype.hasOwnProperty.call(incomingState, 'navTabs')) ||
    prevState.state?.navTabs === undefined
  ) {
    return newState;
  }
  const nextPublicState =
    incomingState && typeof incomingState === 'object'
      ? incomingState
      : {};
  return {
    ...newState,
    state: {
      ...nextPublicState,
      // Profile/cache state updates are partial and do not carry private
      // owner nav preferences. Keep the session-owned snapshot unless the
      // incoming state explicitly includes navTabs.
      navTabs: prevState.state.navTabs
    }
  };
}

export default function UserReducer(
  state: { [key: string]: any },
  action: { type: string; [key: string]: any }
) {
  switch (action.type) {
    case 'CHANGE_DEFAULT_FILTER':
      return {
        ...state,
        myState: {
          ...state.myState,
          searchFilter: action.filter
        }
      };
    case 'CHANGE_BUILD_QUICK_ACCESS_MODE':
      return {
        ...state,
        myState: {
          ...state.myState,
          buildQuickAccessMode:
            action.mode === 'favorites' ? 'favorites' : 'recent'
        }
      };
    case 'SET_BUILD_HEADER_COLLAPSED':
      return {
        ...state,
        myState: {
          ...state.myState,
          buildHeaderCollapsed: !!action.collapsed
        }
      };
    case 'SET_LUMINE_HEADER_MINIMIZED':
      return {
        ...state,
        myState: {
          ...state.myState,
          lumineHeaderMinimized: !!action.minimized
        }
      };
    case 'CLEAR_USER_SEARCH':
      return {
        ...state,
        searchedProfiles: []
      };
    case 'CLOSE_SIGNIN_MODAL':
      return {
        ...state,
        signinModalShown: false
      };
    case 'INIT_MY_STATE':
      return {
        ...state,
        myState: {
          ...state.myState,
          ...normalizeCommunityFundsState(action.data)
        },
        missions: action.data.state?.missions || {},
        loaded: true,
        sessionInterruption: null,
        signinModalShown: false
      };
    case 'LOAD_USERS': {
      let loadMoreButton = false;
      if (action.data.length > 5) {
        action.data.pop();
        loadMoreButton = true;
      }
      return {
        ...state,
        profiles: action.data,
        loadMoreButton,
        profilesLoaded: true
      };
    }
    case 'LOAD_MORE_USERS': {
      let loadMoreButton = false;
      if (action.data.length > 1) {
        action.data.pop();
        loadMoreButton = true;
      }
      return {
        ...state,
        profiles: state.profiles.concat(action.data),
        loadMoreButton
      };
    }
    case 'LOGIN':
      return {
        ...state,
        myState: {
          ...initialMyState,
          ...normalizeCommunityFundsState(action.data)
        },
        sessionInterruption: null,
        signinModalShown: false
      };
    case 'LOGOUT':
      return {
        ...state,
        achievementsObj: state.achievementsObj || {},
        sessionInterruption: null,
        signinModalShown: false,
        myState: initialMyState
      };
    case 'SESSION_INTERRUPTED':
      return {
        ...state,
        loaded: true,
        sessionInterruption: action.interruption,
        signinModalShown: true,
        achievementsObj: state.achievementsObj || {},
        myState: initialMyState
      };
    case 'OPEN_SIGNIN_MODAL':
      return {
        ...state,
        signinModalShown: true
      };
    case 'SEARCH_USERS':
      return {
        ...state,
        searchedProfiles: action.users
      };
    case 'SET_SESSION_LOADED':
      return {
        ...state,
        loaded: true
      };
    case 'SHOW_PROFILE_COMMENTS':
      return {
        ...state,
        profiles: state.profiles.map(
          (profile: { id: string; commentsShown: boolean }) => ({
            ...profile,
            commentsShown:
              profile.id === action.profileId ? true : profile.commentsShown
          })
        )
      };
    case 'SIGNUP':
      return {
        ...state,
        myState: {
          ...initialMyState,
          ...normalizeCommunityFundsState(action.data)
        },
        sessionInterruption: null,
        signinModalShown: false
      };
    case 'SET_ACHIEVERS': {
      return {
        ...state,
        achieverObj: {
          ...state.achieverObj,
          [action.achievementId]: action.achievers
        }
      };
    }
    case 'SET_ACHIEVEMENTS_OBJ':
      return {
        ...state,
        achievementsObj: action.achievementsObj
      };
    case 'UPDATE_ACHIEVEMENT_UNLOCK_STATUS': {
      const newUnlockedAchievementIds = action.isUnlocked
        ? (
            (state.userObj[action.userId] || {}).unlockedAchievementIds || []
          ).concat(achievementTypeToId[action.achievementType])
        : (
            (state.userObj[action.userId] || {}).unlockedAchievementIds || []
          ).filter(
            (id: number) => id !== achievementTypeToId[action.achievementType]
          );
      const newAchievementPoints = newUnlockedAchievementIds.reduce(
        (acc: number, id: number) =>
          acc +
          ((state.achievementsObj?.[achievementIdToType[id]] || {}).ap || 0),
        0
      );
      return {
        ...state,
        userObj: {
          ...state.userObj,
          [action.userId]: {
            ...(state.userObj[action.userId] || {}),
            achievementPoints: newAchievementPoints,
            unlockedAchievementIds: newUnlockedAchievementIds
          }
        }
      };
    }
    case 'SET_COLLECT_TYPE':
      return {
        ...state,
        myState: {
          ...state.myState,
          collectType: action.collectType
        }
      };
    case 'SET_LAST_CHAT_PATH':
      return {
        ...state,
        myState: {
          ...state.myState,
          lastChatPath: action.lastChatPath
        }
      };
    case 'SET_ORDER_USERS_BY':
      return {
        ...state,
        orderUsersBy: action.label
      };
    case 'SET_PROFILES_LOADED':
      return {
        ...state,
        profilesLoaded: action.loaded
      };
    case 'SET_IS_ACHIEVEMENTS_LOADED':
      return {
        ...state,
        myState: {
          ...state.myState,
          isAchievementsLoaded: action.isAchievementsLoaded
        }
      };
    case 'SET_USER_STATE': {
      const normalizedNewState = normalizeCommunityFundsState(action.newState);
      const prevUser = state.userObj[action.userId] || {};
      let updatedUser: any = {
        ...prevUser,
        ...normalizedNewState,
        userId: action.userId,
        contentId: action.userId
      };

      const prevRank = Number(prevUser.rank);
      const incomingHasRank = Object.prototype.hasOwnProperty.call(
        normalizedNewState || {},
        'rank'
      );
      const mergedRank = Number(updatedUser.rank);
      if (incomingHasRank && prevRank > 0 && !(mergedRank > 0)) {
        updatedUser = { ...updatedUser, rank: prevRank };
      }

      const isViewer = action.userId === state.myState.userId;
      let nextMyState = state.myState;
      if (isViewer) {
        const normalizedViewerState = preservePrivateViewerState({
          newState: normalizedNewState,
          prevState: state.myState
        });
        nextMyState = {
          ...state.myState,
          ...normalizedViewerState,
          userId: action.userId,
          contentId: action.userId
        } as any;
        const prevMyRank = Number(state.myState.rank);
        const incomingMyHasRank = incomingHasRank;
        const mergedMyRank = Number((nextMyState as any).rank);
        if (incomingMyHasRank && prevMyRank > 0 && !(mergedMyRank > 0)) {
          (nextMyState as any).rank = prevMyRank;
        }
      }

      return {
        ...state,
        userObj: {
          ...state.userObj,
          [action.userId]: updatedUser
        },
        myState: nextMyState
      };
    }
    case 'APPLY_CANONICAL_USER_PROFILE_STATE': {
      const userId = Number(action.userId);
      const profileState =
        action.profileState &&
        typeof action.profileState === 'object' &&
        !Array.isArray(action.profileState)
          ? action.profileState
          : {};
      const updatedUser = applyCanonicalUserProfileStatePatch({
        profileState,
        user: state.userObj[userId],
        userId
      });
      const nextMyState =
        userId === Number(state.myState.userId)
          ? applyCanonicalUserProfileStatePatch({
              profileState,
              user: state.myState,
              userId
            })
          : state.myState;
      return {
        ...state,
        userObj: {
          ...state.userObj,
          [userId]: updatedUser
        },
        myState: nextMyState
      };
    }
    case 'TOGGLE_HIDE_WATCHED':
      return {
        ...state,
        myState: {
          ...state.myState,
          hideWatched: action.hideWatched
        }
      };
    case 'TOGGLE_WORDLE_STRICT_MODE':
      return {
        ...state,
        myState: {
          ...state.myState,
          wordleStrictMode: action.strictMode
        }
      };
    case 'UPDATE_AI_CARD_OFFER_CHECK_TIMESTAMP':
      return {
        ...state,
        myState: {
          ...state.myState,
          state: {
            ...state.myState.state,
            notifications: {
              ...state.myState.state?.notifications,
              recentAICardOfferCheckTimeStamp: action.timeStamp
            }
          }
        }
      };
    case 'UPDATE_NAV_TABS_STATE':
      return {
        ...state,
        myState: {
          ...state.myState,
          state: {
            ...state.myState.state,
            navTabs: action.navTabs
          }
        }
      };
    case 'UPDATE_MISSION_STATE':
      return {
        ...state,
        missions: {
          ...state.missions,
          [action.missionType]: {
            ...state.missions[action.missionType],
            ...action.newState
          }
        }
      };
    case 'SET_COMMUNITY_FUNDS':
      return {
        ...state,
        myState: {
          ...state.myState,
          communityFunds: action.amount,
          communityFundsLoaded: true
        }
      };
    case 'UPDATE_COMMUNITY_FUNDS':
      return {
        ...state,
        myState: {
          ...state.myState,
          communityFunds: action.totalFunds,
          communityFundsLoaded: true
        }
      };
    default:
      return state;
  }
}
