import { Dispatch } from '~/types';

export default function ExploreActions(dispatch: Dispatch) {
  return {
    onChangeSearchInput(text: string) {
      return dispatch({
        type: 'CHANGE_SEARCH_INPUT',
        text
      });
    },
    onClearAICardsLoaded() {
      return dispatch({
        type: 'CLEAR_AI_CARDS_LOADED'
      });
    },
    onClearLinksLoaded() {
      return dispatch({
        type: 'CLEAR_LINKS_LOADED'
      });
    },
    onChangeFeaturedPlaylists(playlists: object[]) {
      return dispatch({
        type: 'CHANGE_FEATURED_PLAYLISTS',
        data: playlists
      });
    },
    onChangePlaylistVideos(playlist: object) {
      return dispatch({
        type: 'CHANGE_PLAYLIST_VIDEOS',
        playlist
      });
    },
    onChangeVideoByUserStatus({
      videoId,
      byUser
    }: {
      videoId: string;
      byUser: boolean;
    }) {
      return dispatch({
        type: 'CHANGE_VIDEO_BY_USER_STATUS',
        videoId,
        byUser
      });
    },
    onClearVideosLoaded() {
      return dispatch({
        type: 'CLEAR_VIDEOS_LOADED'
      });
    },
    onCloseAddPlaylistModal() {
      return dispatch({
        type: 'CLOSE_PLAYLIST_MODAL'
      });
    },
    onCloseReorderFeaturedPlaylists() {
      return dispatch({
        type: 'CLOSE_REORDER_FEATURED_PL_MODAL'
      });
    },
    onCloseSelectFeaturedPlaylists() {
      return dispatch({
        type: 'CLOSE_SELECT_FEATURED_PL_MODAL'
      });
    },
    onDeletePlaylist(playlistId: number) {
      return dispatch({
        type: 'DELETE_PLAYLIST',
        playlistId
      });
    },
    onEditLinkPage({
      id,
      title,
      content
    }: {
      id: number;
      title: string;
      content: string;
    }) {
      return dispatch({
        type: 'EDIT_LINK_PAGE',
        id,
        title,
        content
      });
    },
    onEditLinkTitle(params: object) {
      return dispatch({
        type: 'EDIT_LINK_TITLE',
        data: params
      });
    },
    onEditPlaylistTitle({
      playlistId,
      title
    }: {
      playlistId: number;
      title: string;
    }) {
      return dispatch({
        type: 'EDIT_PLAYLIST_TITLE',
        playlistId,
        title
      });
    },
    onEditVideoThumbs(params: object) {
      return dispatch({
        type: 'EDIT_VIDEO_THUMBS',
        params
      });
    },
    onLoadAICards({
      cards,
      loadMoreShown,
      numCards
    }: {
      cards: object[];
      loadMoreShown: boolean;
      numCards: number;
    }) {
      return dispatch({
        type: 'LOAD_AI_CARDS',
        cards,
        loadMoreShown,
        numCards
      });
    },
    onLoadMoreAICards({
      cards,
      loadMoreShown
    }: {
      cards: object[];
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_AI_CARDS',
        cards,
        loadMoreShown
      });
    },
    onLoadFilteredAICards({
      cards,
      loadMoreShown
    }: {
      cards: object[];
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_FILTERED_AI_CARDS',
        cards,
        loadMoreShown
      });
    },
    onLoadMoreFilteredAICards({
      cards,
      loadMoreShown
    }: {
      cards: object[];
      loadMoreShown: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_FILTERED_AI_CARDS',
        cards,
        loadMoreShown
      });
    },
    onLoadContinueWatching({
      videos,
      loadMoreButton,
      showingRecommendedVideos
    }: {
      videos: object[];
      loadMoreButton: boolean;
      showingRecommendedVideos: boolean;
    }) {
      return dispatch({
        type: 'LOAD_CONTINUE_WATCHING',
        videos,
        loadMoreButton,
        showingRecommendedVideos
      });
    },
    onLoadMoreContinueWatching({
      videos,
      loadMoreButton
    }: {
      videos: object[];
      loadMoreButton: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_CONTINUE_WATCHING',
        videos,
        loadMoreButton
      });
    },
    onLoadLinks({
      links,
      loadMoreButton
    }: {
      links: object[];
      loadMoreButton: boolean;
    }) {
      return dispatch({
        type: 'LOAD_LINKS',
        links,
        loadMoreButton
      });
    },
    onLoadMoreLinks({
      links,
      loadMoreButton
    }: {
      links: object[];
      loadMoreButton: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_LINKS',
        links,
        loadMoreButton
      });
    },
    onLoadByUserLinks({
      links,
      loadMoreButton
    }: {
      links: object[];
      loadMoreButton: boolean;
    }) {
      return dispatch({
        type: 'LOAD_BY_USER_LINKS',
        links,
        loadMoreButton
      });
    },
    onLoadMoreByUserLinks({
      links,
      loadMoreButton
    }: {
      links: object[];
      loadMoreButton: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_BY_USER_LINKS',
        links,
        loadMoreButton
      });
    },
    onLoadRecommendedLinks({
      links,
      loadMoreButton
    }: {
      links: object[];
      loadMoreButton: boolean;
    }) {
      return dispatch({
        type: 'LOAD_RECOMMENDED_LINKS',
        recommendeds: links,
        loadMoreButton
      });
    },
    onLoadMoreRecommendedLinks({
      links,
      loadMoreButton
    }: {
      links: object[];
      loadMoreButton: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_RECOMMENDED_LINKS',
        recommendeds: links,
        loadMoreButton
      });
    },
    onLoadRecommendedSubjects({
      subjects,
      loadMoreButton
    }: {
      subjects: object[];
      loadMoreButton: boolean;
    }) {
      return dispatch({
        type: 'LOAD_RECOMMENDED_SUBJECTS',
        subjects,
        loadMoreButton
      });
    },
    onLoadByUserSubjects({
      subjects,
      loadMoreButton
    }: {
      subjects: object[];
      loadMoreButton: boolean;
    }) {
      return dispatch({
        type: 'LOAD_BY_USER_SUBJECTS',
        subjects,
        loadMoreButton
      });
    },
    onLoadMoreByUserSubjects({
      subjects,
      loadMoreButton
    }: {
      subjects: object[];
      loadMoreButton: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_BY_USER_SUBJECTS',
        subjects,
        loadMoreButton
      });
    },
    onLoadMoreRecommendedSubjects({
      subjects,
      loadMoreButton
    }: {
      subjects: object[];
      loadMoreButton: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_RECOMMENDED_SUBJECTS',
        subjects,
        loadMoreButton
      });
    },
    onLoadFeaturedPlaylists(playlists: object[]) {
      return dispatch({
        type: 'LOAD_FEATURED_PLAYLISTS',
        playlists
      });
    },
    onLikeLink({ id, likes }: { id: number; likes: object[] }) {
      return dispatch({
        type: 'LIKE_LINK',
        id,
        likes
      });
    },
    onLikeVideo({ likes, videoId }: { likes: object[]; videoId: number }) {
      return dispatch({
        type: 'LIKE_VIDEO',
        likes,
        videoId
      });
    },
    onLoadFeaturedSubjects(subjects: object[]) {
      return dispatch({
        type: 'LOAD_FEATURED_SUBJECTS',
        subjects
      });
    },
    onLoadMoreSearchResults({
      filter,
      results,
      loadMoreButton
    }: {
      filter: string;
      results: object[];
      loadMoreButton: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_SEARCH_RESULTS',
        filter,
        results,
        loadMoreButton
      });
    },
    onLoadPlaylists({
      playlists,
      loadMoreButton
    }: {
      playlists: object[];
      loadMoreButton: boolean;
    }) {
      return dispatch({
        type: 'LOAD_PLAYLISTS',
        playlists,
        loadMoreButton
      });
    },
    onLoadMorePlaylists({
      playlists,
      isSearch,
      loadMoreButton
    }: {
      playlists: object[];
      isSearch: boolean;
      loadMoreButton: boolean;
    }) {
      return dispatch({
        type: 'LOAD_MORE_PLAYLISTS',
        playlists,
        isSearch,
        loadMoreButton
      });
    },
    onLoadMorePlaylistsToPin(data: object) {
      return dispatch({
        type: 'LOAD_MORE_PLAYLISTS_TO_PIN',
        data
      });
    },
    onLoadSearchResults({
      filter,
      results,
      loadMoreButton,
      searchText
    }: {
      filter: string;
      results: object[];
      loadMoreButton: boolean;
      searchText: string;
    }) {
      return dispatch({
        type: 'LOAD_SEARCH_RESULTS',
        filter,
        results,
        loadMoreButton,
        searchText
      });
    },
    onOpenAddPlaylistModal() {
      return dispatch({
        type: 'OPEN_PLAYLIST_MODAL'
      });
    },
    onOpenReorderFeaturedPlaylists() {
      return dispatch({
        type: 'OPEN_REORDER_FEATURED_PL_MODAL'
      });
    },
    onOpenSelectFeaturedPlaylists(data: object) {
      return dispatch({
        type: 'OPEN_SELECT_FEATURED_PL_MODAL',
        data
      });
    },
    onSetNumFilteredCards(numCards: number) {
      return dispatch({
        type: 'SET_NUM_FILTERED_CARDS',
        numCards
      });
    },
    onSetSearchedPlaylists({
      playlists,
      loadMoreButton
    }: {
      playlists: object[];
      loadMoreButton: boolean;
    }) {
      return dispatch({
        type: 'SET_SEARCHED_PLAYLISTS',
        playlists,
        loadMoreButton
      });
    },
    onSetPrevAICardFilters(filters: object) {
      return dispatch({
        type: 'SET_PREV_AI_CARD_FILTERS',
        filters
      });
    },
    onSetThumbRewardLevel({
      videoId,
      rewardLevel
    }: {
      videoId: number;
      rewardLevel: number;
    }) {
      return dispatch({
        type: 'SET_REWARD_LEVEL',
        videoId,
        rewardLevel
      });
    },
    onSetFeaturedSubjectsExpanded(expanded: boolean) {
      return dispatch({
        type: 'SET_FEATURED_SUBJECTS_EXPANDED',
        expanded
      });
    },
    onSetPrevUserId(userId: number) {
      return dispatch({
        type: 'SET_PREV_USER_ID_FOR_EXPLORE',
        userId
      });
    },
    onSetRecommendedSubjectsExpanded(expanded: boolean) {
      return dispatch({
        type: 'SET_RECOMMENDED_SUBJECTS_EXPANDED',
        expanded
      });
    },
    onSetByUserSubjectsExpanded(expanded: boolean) {
      return dispatch({
        type: 'SET_BY_USERS_EXPANDED',
        expanded
      });
    },
    onSetNavVideoState(newState: object) {
      return dispatch({
        type: 'SET_NAV_VIDEOS',
        newState
      });
    },
    onSetSubjectsLoaded(loaded: boolean) {
      return dispatch({
        type: 'SET_SUBJECTS_LOADED',
        loaded
      });
    },
    onUpdateNumLinkComments({
      id,
      updateType
    }: {
      id: number;
      updateType: string;
    }) {
      return dispatch({
        type: 'UPDATE_NUM_LINK_COMMENTS',
        id,
        updateType
      });
    },
    onUploadLink(linkItem: object) {
      return dispatch({
        type: 'UPLOAD_LINK',
        linkItem
      });
    },
    onUploadPlaylist(data: object) {
      return dispatch({
        type: 'UPLOAD_PLAYLIST',
        data
      });
    }
  };
}
