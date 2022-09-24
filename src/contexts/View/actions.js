export default function ViewActions(dispatch) {
  return {
    onChangePageVisibility(visible) {
      return dispatch({
        type: 'CHANGE_PAGE_VISIBILITY',
        visible
      });
    },
    onRecordScrollPosition({ section, position }) {
      return dispatch({
        type: 'RECORD_SCROLL_POSITION',
        section,
        position
      });
    },
    onSetExploreCategory(category) {
      return dispatch({
        type: 'SET_EXPLORE_CATEGORY',
        category
      });
    },
    onSetContentNav(nav) {
      return dispatch({
        type: 'SET_CONTENT_NAV',
        nav
      });
    },
    onSetContentPath(path) {
      return dispatch({
        type: 'SET_CONTENT_PATH',
        path
      });
    },
    onSetHomeNav(nav) {
      return dispatch({
        type: 'SET_HOME_NAV',
        nav
      });
    },
    onSetPageTitle(title) {
      return dispatch({
        type: 'SET_PAGE_TITLE',
        title
      });
    },
    onSetProfileNav(nav) {
      return dispatch({
        type: 'SET_PROFILE_NAV',
        nav
      });
    }
  };
}
