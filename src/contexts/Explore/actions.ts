import { Dispatch } from '~/types';

export default function ExploreActions(dispatch: Dispatch) {
  return {
    onChangeSearchInput(text: string) {
      dispatch({
        type: 'CHANGE_SEARCH_INPUT',
        text
      });
    },
    onClearAICardsLoaded() {
      dispatch({
        type: 'CLEAR_AI_CARDS_LOADED'
      });
    },
    onClearLinksLoaded() {
      dispatch({
        type: 'CLEAR_LINKS_LOADED'
      });
    },
    onChangeFeaturedPlaylists(playlists: object[]) {
      dispatch({
        type: 'CHANGE_FEATURED_PLAYLISTS',
        data: playlists
      });
    },
    onChangePlaylistVideos(playlist: object) {
      dispatch({
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
      dispatch({
        type: 'CHANGE_VIDEO_BY_USER_STATUS',
        videoId,
        byUser
      });
    },
    onClearVideosLoaded() {
      dispatch({
        type: 'CLEAR_VIDEOS_LOADED'
      });
    },
    onCloseAddPlaylistModal() {
      dispatch({
        type: 'CLOSE_PLAYLIST_MODAL'
      });
    },
    onCloseReorderFeaturedPlaylists() {
      dispatch({
        type: 'CLOSE_REORDER_FEATURED_PL_MODAL'
      });
    },
    onCloseSelectFeaturedPlaylists() {
      dispatch({
        type: 'CLOSE_SELECT_FEATURED_PL_MODAL'
      });
    },
    onDeletePlaylist(playlistId: number) {
      dispatch({
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
      dispatch({
        type: 'EDIT_LINK_PAGE',
        id,
        title,
        content
      });
    },
    onEditLinkTitle(params: object) {
      dispatch({
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
      dispatch({
        type: 'EDIT_PLAYLIST_TITLE',
        playlistId,
        title
      });
    },
    onEditVideoThumbs(params: object) {
      dispatch({
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
      dispatch({
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
      dispatch({
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
      dispatch({
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
      dispatch({
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
      dispatch({
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
      dispatch({
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
      dispatch({
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
      dispatch({
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
      dispatch({
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
      dispatch({
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
      dispatch({
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
      dispatch({
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
      dispatch({
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
      dispatch({
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
      dispatch({
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
      dispatch({
        type: 'LOAD_MORE_RECOMMENDED_SUBJECTS',
        subjects,
        loadMoreButton
      });
    },
    onLoadFeaturedPlaylists(playlists: object[]) {
      dispatch({
        type: 'LOAD_FEATURED_PLAYLISTS',
        playlists
      });
    },
    onLikeLink({ id, likes }: { id: number; likes: object[] }) {
      dispatch({
        type: 'LIKE_LINK',
        id,
        likes
      });
    },
    onLikeVideo({ likes, videoId }: { likes: object[]; videoId: number }) {
      dispatch({
        type: 'LIKE_VIDEO',
        likes,
        videoId
      });
    },
    onLoadFeaturedSubjects(subjects: object[]) {
      dispatch({
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
      dispatch({
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
      dispatch({
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
      dispatch({
        type: 'LOAD_MORE_PLAYLISTS',
        playlists,
        isSearch,
        loadMoreButton
      });
    },
    onLoadMorePlaylistsToPin(data: object) {
      dispatch({
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
      dispatch({
        type: 'LOAD_SEARCH_RESULTS',
        filter,
        results,
        loadMoreButton,
        searchText
      });
    },
    onOpenAddPlaylistModal() {
      dispatch({
        type: 'OPEN_PLAYLIST_MODAL'
      });
    },
    onOpenReorderFeaturedPlaylists() {
      dispatch({
        type: 'OPEN_REORDER_FEATURED_PL_MODAL'
      });
    },
    onOpenSelectFeaturedPlaylists(data: object) {
      dispatch({
        type: 'OPEN_SELECT_FEATURED_PL_MODAL',
        data
      });
    },
    onSetNumFilteredCards(numCards: number) {
      dispatch({
        type: 'SET_NUM_FILTERED_CARDS',
        numCards
      });
    },
    onSetFilteredCardsTotalBv(totalBv: number) {
      dispatch({
        type: 'SET_FILTERED_CARDS_TOTAL_BV',
        totalBv
      });
    },
    onSetSearchedPlaylists({
      playlists,
      loadMoreButton
    }: {
      playlists: object[];
      loadMoreButton: boolean;
    }) {
      dispatch({
        type: 'SET_SEARCHED_PLAYLISTS',
        playlists,
        loadMoreButton
      });
    },
    onSetPrevAICardFilters(filters: object) {
      dispatch({
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
      dispatch({
        type: 'SET_REWARD_LEVEL',
        videoId,
        rewardLevel
      });
    },
    onSetFeaturedSubjectsExpanded(expanded: boolean) {
      dispatch({
        type: 'SET_FEATURED_SUBJECTS_EXPANDED',
        expanded
      });
    },
    onSetPrevUserId(userId: number) {
      dispatch({
        type: 'SET_PREV_USER_ID_FOR_EXPLORE',
        userId
      });
    },
    onSetRecommendedSubjectsExpanded(expanded: boolean) {
      dispatch({
        type: 'SET_RECOMMENDED_SUBJECTS_EXPANDED',
        expanded
      });
    },
    onSetByUserSubjectsExpanded(expanded: boolean) {
      dispatch({
        type: 'SET_BY_USERS_EXPANDED',
        expanded
      });
    },
    onSetNavVideoState(newState: object) {
      dispatch({
        type: 'SET_NAV_VIDEOS',
        newState
      });
    },
    onSetSubjectsLoaded(loaded: boolean) {
      dispatch({
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
      dispatch({
        type: 'UPDATE_NUM_LINK_COMMENTS',
        id,
        updateType
      });
    },
    onUploadLink(linkItem: object) {
      dispatch({
        type: 'UPLOAD_LINK',
        linkItem
      });
    },
    onUploadPlaylist(data: object) {
      dispatch({
        type: 'UPLOAD_PLAYLIST',
        data
      });
    }
  };
}
