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
    onSetAiFeaturesDisabled(disabled: boolean) {
      return dispatch({
        type: 'SET_AI_FEATURES_DISABLED',
        disabled
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
    onSetMissionNav(nav: string) {
      return dispatch({
        type: 'SET_MISSION_NAV',
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
    onSetBoardNav(nav: string) {
      return dispatch({
        type: 'SET_BOARD_NAV',
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
    },
    onSetBuildNavHidden(hidden: boolean) {
      return dispatch({
        type: 'SET_BUILD_NAV_HIDDEN',
        hidden
      });
    },
    onSetBuildAppMuted(buildAppId: string, muted: boolean) {
      return dispatch({
        type: 'SET_BUILD_APP_MUTED',
        buildAppId,
        muted
      });
    },
    onToggleBuildAppMuted(buildAppId: string) {
      return dispatch({
        type: 'SET_BUILD_APP_MUTED',
        buildAppId
      });
    },
    onSetBuildAppNavTabIds(buildAppIds: string[] | null) {
      return dispatch({
        type: 'SET_BUILD_APP_NAV_TAB_IDS',
        buildAppIds
      });
    },
    onSetOpenBuildTab(
      openBuildTab: {
        to: string;
        label: string;
        kind: 'app' | 'workspace';
        ownerUserId: number | string | null;
      } | null
    ) {
      return dispatch({
        type: 'SET_OPEN_BUILD_TAB',
        openBuildTab
      });
    },
    // pass a build id to request its tab be closed; pass null to clear the
    // request once consumed
    onRequestCloseBuildApp(
      buildAppId: string | null,
      ownerUserId: number | string | null = null
    ) {
      return dispatch({
        type: 'SET_BUILD_APP_TO_CLOSE',
        buildAppId: buildAppId ?? undefined,
        ownerUserId
      });
    },
    // ask the keep-alive host to tear down the running session for this build
    onKillBuildAppSession(buildAppId: string) {
      return dispatch({
        type: 'KILL_BUILD_APP_SESSION',
        buildAppId
      });
    }
  };
}
