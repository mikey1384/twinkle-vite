import { Dispatch } from '~/types';

export default function ViewActions(dispatch: Dispatch) {
  return {
    onChangePageVisibility(visible: boolean) {
      return dispatch({
        type: 'CHANGE_PAGE_VISIBILITY',
        visible
      });
    },
    onRecordScrollPosition({
      section,
      position
    }: {
      section: string;
      position: number;
    }) {
      return dispatch({
        type: 'RECORD_SCROLL_POSITION',
        section,
        position
      });
    },
    onSetExploreCategory(category: string) {
      return dispatch({
        type: 'SET_EXPLORE_CATEGORY',
        category
      });
    },
    onSetContentNav(nav: string) {
      return dispatch({
        type: 'SET_CONTENT_NAV',
        nav
      });
    },
    onSetContentPath(path: string) {
      return dispatch({
        type: 'SET_CONTENT_PATH',
        path
      });
    },
    onSetHomeNav(nav: string) {
      return dispatch({
        type: 'SET_HOME_NAV',
        nav
      });
    },
    onSetPageTitle(title: string) {
      return dispatch({
        type: 'SET_PAGE_TITLE',
        title
      });
    },
    onSetProfileNav(nav: string) {
      return dispatch({
        type: 'SET_PROFILE_NAV',
        nav
      });
    }
  };
}
