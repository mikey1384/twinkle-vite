export default function ExploreActions(dispatch) {
  return {
    onChangeSearchInput(text) {
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
    onChangeFeaturedPlaylists(playlists) {
      return dispatch({
        type: 'CHANGE_FEATURED_PLAYLISTS',
        data: playlists
      });
    },
    onChangePlaylistVideos(playlist) {
      return dispatch({
        type: 'CHANGE_PLAYLIST_VIDEOS',
        playlist
      });
    },
    onChangeVideoByUserStatus({ videoId, byUser }) {
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
    onClickSafeOff() {
      return dispatch({
        type: 'TURN_OFF_CLICK_SAFE'
      });
    },
    onClickSafeOn() {
      return dispatch({
        type: 'TURN_ON_CLICK_SAFE'
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
    onDeletePlaylist(playlistId) {
      return dispatch({
        type: 'DELETE_PLAYLIST',
        playlistId
      });
    },
    onEditLinkPage({ id, title, content }) {
      return dispatch({
        type: 'EDIT_LINK_PAGE',
        id,
        title,
        content
      });
    },
    onEditLinkTitle(params) {
      return dispatch({
        type: 'EDIT_LINK_TITLE',
        data: params
      });
    },
    onEditPlaylistTitle({ playlistId, title }) {
      return dispatch({
        type: 'EDIT_PLAYLIST_TITLE',
        playlistId,
        title
      });
    },
    onEditVideoThumbs(params) {
      return dispatch({
        type: 'EDIT_VIDEO_THUMBS',
        params
      });
    },
    onLoadAICards({ cards, loadMoreShown }) {
      return dispatch({
        type: 'LOAD_AI_CARDS',
        cards,
        loadMoreShown
      });
    },
    onLoadMoreAICards({ cards, loadMoreShown }) {
      return dispatch({
        type: 'LOAD_MORE_AI_CARDS',
        cards,
        loadMoreShown
      });
    },
    onLoadFilteredAICards({ cards, loadMoreShown }) {
      return dispatch({
        type: 'LOAD_FILTERED_AI_CARDS',
        cards,
        loadMoreShown
      });
    },
    onLoadMoreFilteredAICards({ cards, loadMoreShown }) {
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
    }) {
      return dispatch({
        type: 'LOAD_CONTINUE_WATCHING',
        videos,
        loadMoreButton,
        showingRecommendedVideos
      });
    },
    onLoadMoreContinueWatching({ videos, loadMoreButton }) {
      return dispatch({
        type: 'LOAD_MORE_CONTINUE_WATCHING',
        videos,
        loadMoreButton
      });
    },
    onLoadLinks({ links, loadMoreButton }) {
      return dispatch({
        type: 'LOAD_LINKS',
        links,
        loadMoreButton
      });
    },
    onLoadMoreLinks({ links, loadMoreButton }) {
      return dispatch({
        type: 'LOAD_MORE_LINKS',
        links,
        loadMoreButton
      });
    },
    onLoadByUserLinks({ links, loadMoreButton }) {
      return dispatch({
        type: 'LOAD_BY_USER_LINKS',
        links,
        loadMoreButton
      });
    },
    onLoadMoreByUserLinks({ links, loadMoreButton }) {
      return dispatch({
        type: 'LOAD_MORE_BY_USER_LINKS',
        links,
        loadMoreButton
      });
    },
    onLoadRecommendedLinks({ links, loadMoreButton }) {
      return dispatch({
        type: 'LOAD_RECOMMENDED_LINKS',
        recommendeds: links,
        loadMoreButton
      });
    },
    onLoadMoreRecommendedLinks({ links, loadMoreButton }) {
      return dispatch({
        type: 'LOAD_MORE_RECOMMENDED_LINKS',
        recommendeds: links,
        loadMoreButton
      });
    },
    onLoadRecommendedSubjects({ subjects, loadMoreButton }) {
      return dispatch({
        type: 'LOAD_RECOMMENDED_SUBJECTS',
        subjects,
        loadMoreButton
      });
    },
    onLoadByUserSubjects({ subjects, loadMoreButton }) {
      return dispatch({
        type: 'LOAD_BY_USER_SUBJECTS',
        subjects,
        loadMoreButton
      });
    },
    onLoadMoreByUserSubjects({ subjects, loadMoreButton }) {
      return dispatch({
        type: 'LOAD_MORE_BY_USER_SUBJECTS',
        subjects,
        loadMoreButton
      });
    },
    onLoadMoreRecommendedSubjects({ subjects, loadMoreButton }) {
      return dispatch({
        type: 'LOAD_MORE_RECOMMENDED_SUBJECTS',
        subjects,
        loadMoreButton
      });
    },
    onLoadFeaturedPlaylists(playlists) {
      return dispatch({
        type: 'LOAD_FEATURED_PLAYLISTS',
        playlists
      });
    },
    onLikeLink({ id, likes }) {
      return dispatch({
        type: 'LIKE_LINK',
        id,
        likes
      });
    },
    onLikeVideo({ likes, videoId }) {
      return dispatch({
        type: 'LIKE_VIDEO',
        likes,
        videoId
      });
    },
    onLoadFeaturedSubjects(subjects) {
      return dispatch({
        type: 'LOAD_FEATURED_SUBJECTS',
        subjects
      });
    },
    onLoadMoreSearchResults({ filter, results, loadMoreButton }) {
      return dispatch({
        type: 'LOAD_MORE_SEARCH_RESULTS',
        filter,
        results,
        loadMoreButton
      });
    },
    onLoadPlaylists({ playlists, loadMoreButton }) {
      return dispatch({
        type: 'LOAD_PLAYLISTS',
        playlists,
        loadMoreButton
      });
    },
    onLoadMorePlaylists({ playlists, isSearch, loadMoreButton }) {
      return dispatch({
        type: 'LOAD_MORE_PLAYLISTS',
        playlists,
        isSearch,
        loadMoreButton
      });
    },
    onLoadMorePlaylistsToPin(data) {
      return dispatch({
        type: 'LOAD_MORE_PLAYLISTS_TO_PIN',
        data
      });
    },
    onLoadSearchResults({ filter, results, loadMoreButton }) {
      return dispatch({
        type: 'LOAD_SEARCH_RESULTS',
        filter,
        results,
        loadMoreButton
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
    onOpenSelectFeaturedPlaylists(data) {
      return dispatch({
        type: 'OPEN_SELECT_FEATURED_PL_MODAL',
        data
      });
    },
    onSetSearchedPlaylists({ playlists, loadMoreButton }) {
      return dispatch({
        type: 'SET_SEARCHED_PLAYLISTS',
        playlists,
        loadMoreButton
      });
    },
    onSetPrevAICardFilters(filters) {
      return dispatch({
        type: 'SET_PREV_AI_CARD_FILTERS',
        filters
      });
    },
    onSetThumbRewardLevel({ videoId, rewardLevel }) {
      return dispatch({
        type: 'SET_REWARD_LEVEL',
        videoId,
        rewardLevel
      });
    },
    onSetFeaturedSubjectsExpanded(expanded) {
      return dispatch({
        type: 'SET_FEATURED_SUBJECTS_EXPANDED',
        expanded
      });
    },
    onSetPrevUserId(userId) {
      return dispatch({
        type: 'SET_PREV_USER_ID_FOR_EXPLORE',
        userId
      });
    },
    onSetRecommendedSubjectsExpanded(expanded) {
      return dispatch({
        type: 'SET_RECOMMENDED_SUBJECTS_EXPANDED',
        expanded
      });
    },
    onSetByUserSubjectsExpanded(expanded) {
      return dispatch({
        type: 'SET_BY_USERS_EXPANDED',
        expanded
      });
    },
    onSetNavVideoState(newState) {
      return dispatch({
        type: 'SET_NAV_VIDEOS',
        newState
      });
    },
    onSetSubjectsLoaded(loaded) {
      return dispatch({
        type: 'SET_SUBJECTS_LOADED',
        loaded
      });
    },
    onUpdateNumLinkComments({ id, updateType }) {
      return dispatch({
        type: 'UPDATE_NUM_LINK_COMMENTS',
        id,
        updateType
      });
    },
    onUploadLink(linkItem) {
      return dispatch({
        type: 'UPLOAD_LINK',
        linkItem
      });
    },
    onUploadPlaylist(data) {
      return dispatch({
        type: 'UPLOAD_PLAYLIST',
        data
      });
    }
  };
}
