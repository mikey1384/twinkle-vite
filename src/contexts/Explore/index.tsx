import React, { useReducer, ReactNode } from 'react';
import { createContext } from 'use-context-selector';
import ExploreActions from './actions';
import ExploreReducer from './reducer';

export const ExploreContext = createContext({});
export const initialExploreState = {
  aiCards: {
    cards: [],
    loaded: false,
    loadMoreShown: false,
    prevFilters: {},
    filteredCards: [],
    filteredLoaded: false,
    filteredLoadMoreShown: false,
    numCards: 0,
    numFilteredCards: 0
  },
  links: {
    byUserLoaded: false,
    byUserLinks: [],
    loadMoreByUserLinksButtonShown: false,
    loaded: false,
    links: [],
    loadMoreLinksButtonShown: false,
    recommendedsLoaded: false,
    recommendeds: [],
    loadMoreRecommendedsButtonShown: false
  },
  subjects: {
    byUsers: [],
    byUsersExpanded: false,
    byUsersLoadMoreButton: false,
    byUsersLoaded: false,
    featureds: [],
    featuredExpanded: false,
    recommendeds: [],
    recommendedExpanded: false,
    recommendedLoadMoreButton: false,
    loaded: false
  },
  search: {
    resultObj: {
      subjects: [],
      links: [],
      videos: []
    },
    loadMoreButton: false,
    searchText: '',
    prevSearchText: ''
  },
  videos: {
    addPlaylistModalShown: false,
    allPlaylists: [],
    allPlaylistsLoaded: false,
    allVideoThumbs: [],
    continueWatchingVideos: [],
    continueWatchingLoaded: false,
    loadMoreContinueWatchingButton: false,
    featuredPlaylists: [],
    featuredPlaylistsLoaded: false,
    searchedPlaylists: [],
    loadMorePlaylistsButton: false,
    navVideos: {
      nextVideos: [],
      relatedVideos: [],
      otherVideos: [],
      playlistVideos: [],
      continueWatching: []
    },
    loadMoreFeaturedPlaylistsButton: false,
    loadMoreSearchedPlaylistsButton: false,
    playlistsToPin: [],
    selectFeaturedPlaylistsModalShown: false,
    showingRecommendedVideos: false,
    reorderFeaturedPlaylistsShown: false
  },
  prevUserId: null
};

export function ExploreContextProvider({ children }: { children: ReactNode }) {
  const [exploreState, exploreDispatch] = useReducer(
    ExploreReducer,
    initialExploreState
  );
  return (
    <ExploreContext.Provider
      value={{
        state: exploreState,
        actions: ExploreActions(exploreDispatch)
      }}
    >
      {children}
    </ExploreContext.Provider>
  );
}
