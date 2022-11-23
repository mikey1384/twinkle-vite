import { initialMyState } from '../AppContext';

export default function UserReducer(state, action) {
  switch (action.type) {
    case 'CHANGE_DEFAULT_FILTER':
      return {
        ...state,
        myState: {
          ...state.myState,
          searchFilter: action.filter
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
          ...action.data
        },
        missions: action.data.state?.missions || {},
        loaded: true
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
        myState: action.data,
        signinModalShown: false
      };
    case 'LOGOUT':
      return {
        ...state,
        myState: initialMyState
      };
    case 'LOGOUT_AND_OPEN_SIGNIN_MODAL':
      return {
        ...state,
        signinModalShown: true,
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
        profiles: state.profiles.map((profile) => ({
          ...profile,
          commentsShown:
            profile.id === action.profileId ? true : profile.commentsShown
        }))
      };
    case 'SIGNUP':
      return {
        ...state,
        myState: action.data,
        signinModalShown: false
      };
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
    case 'SET_USER_STATE':
      return {
        ...state,
        userObj: {
          ...state.userObj,
          [action.userId]: {
            ...(state.userObj[action.userId] || {}),
            ...action.newState,
            contentId: action.userId
          }
        }
      };
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
    case 'UPDATE_NUM_WORDS_COLLECTED':
      return {
        ...state,
        myState: {
          ...state.myState,
          numWordsCollected: action.numWordsCollected
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
    default:
      return state;
  }
}
