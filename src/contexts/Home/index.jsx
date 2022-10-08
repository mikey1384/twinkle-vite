import { useReducer } from 'react';
import { createContext } from 'use-context-selector';
import PropTypes from 'prop-types';
import HomeActions from './actions';
import HomeReducer from './reducer';

export const HomeContext = createContext();
export const initialHomeState = {
  category: 'recommended',
  displayOrder: 'desc',
  topMenuSection: 'start',
  feeds: [],
  feedsOutdated: false,
  fileUploadProgress: null,
  grammarGameModalShown: false,
  secretAttachmentUploadProgress: null,
  loadMoreButton: false,
  subFilter: 'all',
  submittingSubject: false,
  uploadingFile: false,
  leaderboardsObj: {}
};

HomeContextProvider.propTypes = {
  children: PropTypes.node
};

export function HomeContextProvider({ children }) {
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
