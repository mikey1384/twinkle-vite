import React, { useReducer, ReactNode } from 'react';
import { createContext } from 'use-context-selector';
import HomeActions from './actions';
import HomeReducer from './reducer';

export const HomeContext = createContext({});
export const initialHomeState = {
  category: 'recommended',
  displayOrder: 'desc',
  topMenuSection: 'start',
  feeds: [],
  feedsOutdated: false,
  fileUploadProgress: null,
  aiStoriesModalShown: false,
  grammarGameModalShown: false,
  inputModalShown: false,
  secretAttachmentUploadProgress: null,
  loadMoreButton: false,
  subFilter: 'all',
  submittingSubject: false,
  uploadingFile: false,
  leaderboardsObj: {}
};

export function HomeContextProvider({ children }: { children: ReactNode }) {
  const [homeState, homeDispatch] = useReducer(HomeReducer, initialHomeState);
  return (
    <HomeContext.Provider
      value={{
        state: homeState,
        actions: HomeActions(homeDispatch)
      }}
    >
      {children}
    </HomeContext.Provider>
  );
}
