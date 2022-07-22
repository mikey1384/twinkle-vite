export default function ViewReducer(state, action) {
  switch (action.type) {
    case 'CHANGE_PAGE_VISIBILITY':
      return {
        ...state,
        pageVisible: action.visible
      };
    case 'RECORD_SCROLL_POSITION':
      return {
        ...state,
        scrollPositions: {
          ...state.scrollPositions,
          [action.section]: action.position
        }
      };
    case 'SET_EXPLORE_CATEGORY':
      return {
        ...state,
        exploreCategory: action.category
      };
    case 'SET_CONTENT_PATH':
      return {
        ...state,
        contentPath: action.path
      };
    case 'SET_CONTENT_NAV':
      return {
        ...state,
        contentNav: action.nav
      };
    case 'SET_HOME_NAV':
      return {
        ...state,
        homeNav: action.nav
      };
    case 'SET_PROFILE_NAV':
      return {
        ...state,
        profileNav: action.nav
      };
    default:
      return state;
  }
}
