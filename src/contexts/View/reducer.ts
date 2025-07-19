export interface ViewState {
  pageVisible: boolean;
  exploreCategory: 'subjects' | 'videos' | 'links' | 'ai-cards';
  contentPath: string;
  contentNav: string;
  pageTitle: string;
  profileNav: string;
  homeNav: string;
  audioKey: string;
}

export interface ViewAction {
  type:
    | 'SET_AUDIO_KEY'
    | 'CHANGE_PAGE_VISIBILITY'
    | 'SET_EXPLORE_CATEGORY'
    | 'SET_CONTENT_PATH'
    | 'SET_CONTENT_NAV'
    | 'SET_HOME_NAV'
    | 'SET_PAGE_TITLE'
    | 'SET_PROFILE_NAV';
  key?: string;
  visible?: boolean;
  category?: ViewState['exploreCategory'];
  path?: string;
  nav?: string;
  title?: string;
}

export default function ViewReducer(
  state: ViewState,
  action: ViewAction
): ViewState {
  switch (action.type) {
    case 'SET_AUDIO_KEY':
      return {
        ...state,
        audioKey: action.key!
      };
    case 'CHANGE_PAGE_VISIBILITY':
      return {
        ...state,
        pageVisible: action.visible!
      };
    case 'SET_EXPLORE_CATEGORY':
      return {
        ...state,
        exploreCategory: action.category!
      };
    case 'SET_CONTENT_PATH':
      return {
        ...state,
        contentPath: action.path!
      };
    case 'SET_CONTENT_NAV':
      return {
        ...state,
        contentNav: action.nav!
      };
    case 'SET_HOME_NAV':
      return {
        ...state,
        homeNav: action.nav!
      };
    case 'SET_PAGE_TITLE':
      return {
        ...state,
        pageTitle: action.title!
      };
    case 'SET_PROFILE_NAV':
      return {
        ...state,
        profileNav: action.nav!
      };
    default:
      return state;
  }
}
