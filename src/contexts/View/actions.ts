import React from 'react';
import { ViewAction, ViewState } from './reducer';

export default function ViewActions(dispatch: React.Dispatch<ViewAction>) {
  return {
    onSetAudioKey(key: string) {
      return dispatch({
        type: 'SET_AUDIO_KEY',
        key
      });
    },
    onChangePageVisibility(visible: boolean) {
      return dispatch({
        type: 'CHANGE_PAGE_VISIBILITY',
        visible
      });
    },
    onSetExploreCategory(category: ViewState['exploreCategory']) {
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
