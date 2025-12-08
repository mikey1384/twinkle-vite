import React, { useReducer, ReactNode, useMemo } from 'react';
import { createContext } from 'use-context-selector';
import HomeActions from './actions';
import HomeReducer from './reducer';

export const HomeContext = createContext({});
export const initialHomeState = {
  category: 'recommended',
  currentFeaturedIndex: 0,
  displayOrder: 'desc',
  topMenuSection: 'start',
  feeds: [],
  feedsOutdated: false,
  fileUploadProgress: null,
  aiStoriesModalShown: false,
  grammarGameModalShown: false,
  chessPuzzleModalShown: false,
  dailyQuestionModalShown: false,
  groupIds: [],
  groupsObj: {},
  searchedGroupIds: [],
  loadMoreGroupsShown: false,
  isGroupsLoaded: false,
  previewGroups: [],
  inputModalShown: false,
  secretAttachmentUploadProgress: null,
  loadMoreButton: false,
  subFilter: 'all',
  submittingSubject: false,
  uploadingFile: false,
  leaderboardsObj: {},
  grammarLoadingStatus: '',
  grammarGenerationProgress: null as null | { current: number; total: number }
};

export function HomeContextProvider({ children }: { children: ReactNode }) {
  const [homeState, homeDispatch] = useReducer(HomeReducer, initialHomeState);
  const memoizedActions = useMemo(
    () => HomeActions(homeDispatch),
    [homeDispatch]
  );
  return (
    <HomeContext.Provider
      value={{
        state: homeState,
        actions: memoizedActions
      }}
    >
      {children}
    </HomeContext.Provider>
  );
}
